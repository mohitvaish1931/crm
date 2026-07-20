import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../../inventory/ledger/ledger.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class SalesOrderService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService
  ) {}

  // 1. Lazy evaluation for reservation expiry (Enhancement 4)
  async getOrder(tenantId: string, orderId: string) {
    const order = await this.prisma.ext.salesOrder.findUnique({
      where: { id: orderId, tenantId },
      include: { items: true }
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 'RESERVED' && (order as any).reservationExpiresAt && new Date() > (order as any).reservationExpiresAt) {
      // Auto-Release logic
      await this.prisma.ext.$transaction(async (tx) => {
        for (const item of order.items) {
          if (Number(item.reservedQty) > 0) {
            await this.ledgerService.releaseReservation(tenantId, {
              variantId: item.variantId,
              warehouseId: order.warehouseId,
              quantity: Number(item.reservedQty),
              referenceId: order.id
            }, tx);
          }
        }
        await tx.salesOrder.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' } // Or 'EXPIRED'
        });
      });
      order.status = 'CANCELLED';
    }

    return order;
  }

  async submitOrder(tenantId: string, orderId: string, userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId, tenantId },
        include: { items: true, customer: { include: { credit: true } } }
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== 'DRAFT') throw new BadRequestException('Only DRAFT orders can be submitted');

      if (order.orderType === 'CREDIT') {
        const credit = order.customer.credit;
        if (!credit) throw new BadRequestException('Customer has no credit account configured');

        // 2. Customer Credit Aging check (Enhancement 1)
        if (Number((credit as any).age_90_plus) > 0) {
           return tx.salesOrder.update({
             where: { id: orderId },
             data: { status: 'CREDIT_HOLD' }
           });
        }

        if (Number(order.totalAmount) > Number(credit.availableCredit)) {
          return tx.salesOrder.update({
            where: { id: orderId },
            data: { status: 'CREDIT_HOLD' }
          });
        } else {
          await tx.customerCredit.update({
            where: { customerId: order.customerId },
            data: { availableCredit: { decrement: order.totalAmount } }
          });
        }
      }

      await this.processReservations(tenantId, order, tx);

      // 3. Set Reservation Expiry for Cash orders (Enhancement 4 setup)
      const expiryHours = 72; // Configurable per tenant
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);

      return tx.salesOrder.update({
        where: { id: orderId },
        data: { 
          status: 'APPROVED', 
          approvedBy: userId,
          ...(order.orderType === 'CASH' && { reservationExpiresAt: expiresAt })
        }
      });
    });
  }

  async approveCreditHold(tenantId: string, orderId: string, userId: string, role: string) {
    if (role !== 'MANAGER' && role !== 'OWNER') {
      throw new BadRequestException('Insufficient privileges to release credit hold');
    }

    return this.prisma.ext.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId, tenantId },
        include: { items: true }
      });

      if (!order || order.status !== 'CREDIT_HOLD') throw new BadRequestException('Order not on credit hold');

      await tx.customerCredit.update({
        where: { customerId: order.customerId },
        data: { availableCredit: { decrement: order.totalAmount } }
      });

      await this.processReservations(tenantId, order, tx);

      return tx.salesOrder.update({
        where: { id: orderId },
        data: { status: 'APPROVED', approvedBy: userId }
      });
    });
  }

  // 4. Multi-Warehouse Partial Allocation (Enhancement 5)
  private async processReservations(tenantId: string, order: any, tx: any) {
    let fullyReserved = true;

    for (const item of order.items) {
      // Find stock across ALL warehouses
      const stockRecords = await tx.currentStock.findMany({
        where: { tenantId, variantId: item.variantId, availableQty: { gt: 0 } },
        orderBy: { availableQty: 'desc' }
      });

      let remainingDemand = Number(item.quantity);
      let totalReserved = 0;

      for (const stock of stockRecords) {
        if (remainingDemand <= 0) break;

        const reserveAmount = Math.min(remainingDemand, Number(stock.availableQty));
        
        await this.ledgerService.reserveStock(tenantId, {
          variantId: item.variantId,
          warehouseId: stock.warehouseId, // Crucial: Dynamic warehouse allocation
          quantity: reserveAmount,
          referenceType: 'SALES_ORDER',
          referenceId: order.id
        }, order.createdBy, tx);

        remainingDemand -= reserveAmount;
        totalReserved += reserveAmount;
      }

      const backorderQty = remainingDemand;

      await tx.salesOrderItem.update({
        where: { id: item.id },
        data: { reservedQty: totalReserved, backorderQty }
      });

      if (backorderQty > 0) {
        fullyReserved = false;
      }
    }

    await tx.salesOrder.update({
      where: { id: order.id },
      data: { status: fullyReserved ? 'RESERVED' : 'PARTIAL_RESERVED' }
    });
  }

  async getSubstituteSuggestions(tenantId: string, variantId: string) {
    const original = await this.prisma.ext.productVariant.findUnique({
      where: { id: variantId, tenantId },
      include: { product: true }
    });
    
    if (!original) throw new NotFoundException();

    const substitutes = await this.prisma.ext.currentStock.findMany({
      where: {
        tenantId,
        availableQty: { gt: 0 },
        variant: { productId: original.productId, id: { not: variantId } }
      },
      include: { variant: true },
      take: 3,
      orderBy: { availableQty: 'desc' }
    });

    return substitutes;
  }
}

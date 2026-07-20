import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../../inventory/ledger/ledger.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class PurchaseReturnService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService
  ) {}

  async createPurchaseReturn(tenantId: string, grnId: string, data: any, userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const grn = await tx.goodsReceipt.findUnique({
        where: { id: grnId, tenantId },
        include: { items: { include: { poItem: true } } }
      });

      if (!grn) throw new NotFoundException('GRN not found');

      const returnId = uuidv7();

      const pr = await tx.purchaseReturn.create({
        data: {
          id: returnId,
          tenantId,
          returnNumber: `PRN-${Date.now()}`,
          grnId: grn.id,
          supplierId: grn.supplierId,
          status: 'DRAFT',
          reason: data.reason
        }
      });

      let totalAmount = 0;

      for (const item of data.items) {
        const grnItem = grn.items.find(i => i.id === item.grnItemId);
        if (!grnItem) throw new BadRequestException(`GRN Item not found`);

        if (item.quantity > grnItem.acceptedQty) {
          throw new BadRequestException(`Cannot return more than accepted quantity for ${grnItem.id}`);
        }

        const unitPrice = Number(grnItem.poItem.unitPrice);
        const itemTotal = unitPrice * item.quantity;
        totalAmount += itemTotal;

        await tx.purchaseReturnItem.create({
          data: {
            id: uuidv7(),
            returnId,
            grnItemId: grnItem.id,
            variantId: grnItem.variantId,
            quantity: item.quantity,
            unitPrice,
            totalAmount: itemTotal,
            reason: item.reason
          }
        });
      }

      await tx.purchaseReturn.update({
        where: { id: returnId },
        data: { totalAmount }
      });

      return pr;
    });
  }

  async processReturn(tenantId: string, returnId: string, userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const pr = await tx.purchaseReturn.findUnique({
        where: { id: returnId, tenantId },
        include: { 
          items: true,
          grn: { include: { items: true } }
        }
      });

      if (!pr) throw new NotFoundException();
      if (pr.status !== 'DRAFT') throw new BadRequestException('Return must be in DRAFT state');

      for (const item of pr.items) {
        const grnItem = pr.grn.items.find(i => i.id === item.grnItemId);
        if (!grnItem) continue;

        // Deduct from Stock Ledger securely using Sprint 3 architecture
        await this.ledgerService.recordMovement(tenantId, {
          variantId: item.variantId,
          warehouseId: pr.grn.warehouseId,
          binId: (grnItem.binId || '') as any,
          type: 'OUT' as any,
          quantity: -Math.abs(Number(item.quantity)),
          referenceType: 'PURCHASE_RETURN',
          referenceId: returnId
        }, userId, tx);
      }

      // Accounting hooks would publish an event here for "Accounts Payable: Debit Note"
      
      return tx.purchaseReturn.update({
        where: { id: returnId },
        data: { status: 'COMPLETED' }
      });
    });
  }
}

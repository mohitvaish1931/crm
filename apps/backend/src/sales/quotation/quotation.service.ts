import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class QuotationService {
  constructor(private prisma: PrismaService) {}

  async createQuotation(tenantId: string, data: any) {
    return this.prisma.ext.$transaction(async (tx) => {
      const quoteId = uuidv7();

      const quote = await tx.salesQuotation.create({
        data: {
          id: quoteId,
          tenantId,
          quoteNumber: `QT-${Date.now()}`,
          customerId: data.customerId,
          status: 'DRAFT',
          totalAmount: data.totalAmount,
          validUntil: data.validUntil ? new Date(data.validUntil) : null
        }
      });

      await tx.salesQuotationItem.createMany({
        data: data.items.map((item: any) => ({
          id: uuidv7(),
          quoteId,
          variantId: item.variantId,
          uomId: item.uomId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPct: item.discountPct || 0,
          total: item.total
        }))
      });

      return quote;
    });
  }

  // --- Quote to Order Conversion ---
  async convertToOrder(tenantId: string, quoteId: string, userId: string, warehouseId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const quote = await tx.salesQuotation.findUnique({
        where: { id: quoteId, tenantId },
        include: { items: true }
      });

      if (!quote) throw new NotFoundException('Quotation not found');
      if (quote.status !== 'APPROVED') throw new BadRequestException('Quotation must be APPROVED to convert to order');

      const orderId = uuidv7();
      
      const order = await tx.salesOrder.create({
        data: {
          id: orderId,
          tenantId,
          orderNumber: `SO-${Date.now()}`,
          customerId: quote.customerId,
          warehouseId,
          status: 'DRAFT',
          orderType: 'CREDIT', // Defaults to CREDIT from Quotation flow
          totalAmount: quote.totalAmount,
          createdBy: userId
        }
      });

      await tx.salesOrderItem.createMany({
        data: quote.items.map(item => ({
          id: uuidv7(),
          orderId,
          variantId: item.variantId,
          uomId: item.uomId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPct: item.discountPct,
          totalAmount: item.total
        }))
      });

      await tx.salesQuotation.update({
        where: { id: quoteId },
        data: { status: 'CONVERTED' }
      });

      return order;
    });
  }
}

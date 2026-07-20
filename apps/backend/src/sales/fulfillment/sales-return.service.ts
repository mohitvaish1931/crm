import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../../inventory/ledger/ledger.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class SalesReturnDispositionService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService
  ) {}

  async processReturnDisposition(tenantId: string, returnId: string, dispositions: any[], userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const salesReturn = await tx.salesReturn.findUnique({
        where: { id: returnId, tenantId },
        include: { items: true, order: true }
      });

      if (!salesReturn || salesReturn.status === 'COMPLETED') {
        throw new BadRequestException('Return not found or already completed');
      }

      for (const update of dispositions) {
        const item = salesReturn.items.find((i: any) => i.id === update.returnItemId);
        if (!item) continue;

        const disposition = update.disposition; // RESTOCK, REPAIR, SCRAP, RETURN_TO_SUPPLIER
        
        await tx.salesReturnItem.update({
          where: { id: item.id },
          data: { disposition }
        });

        // Map disposition to Ledger actions
        if (disposition === 'RESTOCK' || disposition === 'REPAIR') {
          // Re-enter inventory (perhaps into a specific QC or Repair bin, assuming default warehouse logic for now)
          await this.ledgerService.recordMovement(tenantId, {
            variantId: item.variantId,
            warehouseId: salesReturn.order.warehouseId,
            binId: update.targetBinId, // Provide a specific bin based on disposition
            type: 'IN' as any,
            quantity: Number(item.receivedQty),
            referenceType: 'SALES_RETURN',
            referenceId: salesReturn.id
          }, userId, tx);
        } else if (disposition === 'SCRAP') {
          // Into scrap bin, or handled via write-off ledger integration in future
          await this.ledgerService.recordMovement(tenantId, {
            variantId: item.variantId,
            warehouseId: salesReturn.order.warehouseId,
            binId: update.targetBinId, // Provide scrap bin
            type: 'IN' as any,
            quantity: Number(item.receivedQty),
            referenceType: 'SALES_RETURN',
            referenceId: salesReturn.id
          }, userId, tx);
        }
      }

      await tx.salesReturn.update({
        where: { id: returnId },
        data: { status: 'COMPLETED' }
      });

      // Audit Log
      await tx.fulfillmentAuditLog.create({
        data: {
          id: uuidv7(),
          tenantId,
          action: 'RETURN_QC_COMPLETED',
          referenceType: 'SALES_RETURN',
          referenceId: returnId,
          userId
        }
      });

      return { success: true };
    });
  }
}

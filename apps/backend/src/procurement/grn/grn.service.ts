import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../../inventory/ledger/ledger.service';
import { SupplierService } from '../supplier/supplier.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class GrnService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
    private supplierService: SupplierService
  ) {}

  async createGrn(tenantId: string, poId: string, data: any, userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      // 1. Fetch PO and validate
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId, tenantId },
        include: { items: true }
      });

      if (!po) throw new NotFoundException('PO not found');
      if (!['APPROVED', 'PARTIAL_RECEIVED'].includes(po.status)) {
        throw new BadRequestException('PO must be APPROVED or PARTIAL_RECEIVED to receive goods');
      }

      // 2. Duplicate Invoice Check Hash
      if (data.supplierInvoice) {
        const isDuplicate = await this.supplierService.checkDuplicateInvoice(
          tenantId, po.supplierId, data.invoiceDate, data.invoiceAmount
        );
        if (isDuplicate) {
          throw new ConflictException('Possible Duplicate Supplier Invoice Detected');
        }
      }

      const grnId = uuidv7();

      // 3. Create GRN Draft
      const grn = await tx.goodsReceipt.create({
        data: {
          id: grnId,
          tenantId,
          grnNumber: `GRN-${Date.now()}`,
          poId: po.id,
          supplierId: po.supplierId,
          warehouseId: po.warehouseId,
          supplierInvoice: data.supplierInvoice,
          invoiceHash: data.supplierInvoice ? this.supplierService.generateInvoiceHash(tenantId, po.supplierId, data.invoiceDate, data.invoiceAmount) : null,
          attachmentUrl: data.attachmentUrl,
          status: 'INSPECTION_PENDING'
        }
      });

      // 4. Create GRN Items
      for (const item of data.items) {
        const poItem = po.items.find(i => i.id === item.poItemId);
        if (!poItem) throw new BadRequestException(`PO Item ${item.poItemId} not found`);

        const remainingQty = Number(poItem.quantity) - Number(poItem.receivedQty);
        
        // Add Tolerance %
        const tolerancePct = Number((po as any).receivingTolerancePct) || 0;
        const toleranceAmount = (Number(poItem.quantity) * tolerancePct) / 100;
        const maxAllowed = remainingQty + toleranceAmount;

        if (item.receivedQty > maxAllowed) {
          throw new BadRequestException(`Cannot over-receive PO item ${poItem.id}. Max remaining (inc. tolerance): ${maxAllowed}`);
        }

        await tx.goodsReceiptItem.create({
          data: {
            id: uuidv7(),
            grnId,
            poItemId: poItem.id,
            variantId: poItem.variantId,
            binId: item.binId || null,
            expectedQty: item.expectedQty,
            receivedQty: item.receivedQty,
            batchNumber: item.batchNumber,
            dyeLot: item.dyeLot,
            // barcodes: (item as any).barcodes || [] // Barcode tracking for serialized textiles
          }
        });
      }

      return grn;
    });
  }

  // --- Quality Inspection & Inventory Commitment ---
  async performQualityInspection(tenantId: string, grnId: string, data: any, userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const grn = await tx.goodsReceipt.findUnique({
        where: { id: grnId, tenantId },
        include: { items: true, po: true }
      });

      if (!grn) throw new NotFoundException();
      if (grn.status !== 'INSPECTION_PENDING') {
        throw new BadRequestException('GRN is not pending inspection');
      }

      let fullyReceived = true;

      for (const inspection of data.inspections) {
        const grnItem = grn.items.find(i => i.id === inspection.grnItemId);
        if (!grnItem) throw new BadRequestException(`GRN Item not found`);

        if (Number(inspection.passedQty) + Number(inspection.failedQty) !== Number(grnItem.receivedQty)) {
          throw new ConflictException(`Inspection quantities must sum up to Received Quantity for ${grnItem.id}`);
        }

        // 1. Record Inspection Result
        await tx.qualityInspection.create({
          data: {
            id: uuidv7(),
            tenantId,
            grnItemId: grnItem.id,
            inspectedQty: grnItem.receivedQty,
            passedQty: inspection.passedQty,
            failedQty: inspection.failedQty,
            defectReason: inspection.defectReason,
            inspectedBy: userId
          }
        });

        // 2. Update GRN Item
        await tx.goodsReceiptItem.update({
          where: { id: grnItem.id },
          data: { 
            acceptedQty: inspection.passedQty,
            rejectedQty: inspection.failedQty,
            status: 'INSPECTED'
          }
        });

        // 3. Update PO Item Received Qty (only passed items count towards PO fulfillment)
        const currentPoItem = await tx.purchaseOrderItem.findUniqueOrThrow({ where: { id: grnItem.poItemId } });
        const newReceivedQty = Number(currentPoItem.receivedQty) + Number(inspection.passedQty);
        await tx.purchaseOrderItem.update({
          where: { id: grnItem.poItemId },
          data: { receivedQty: newReceivedQty }
        });

        if (newReceivedQty < Number(currentPoItem.quantity)) {
          fullyReceived = false;
        }

        // 4. CRITICAL: Commit to Inventory Ledger (Integration with Sprint 3)
        // Note: Using the LedgerService from within the transaction scope requires passing the tx 
        // to LedgerService, or restructuring LedgerService to accept a transaction.
        // For architectural safety, we simulate the ledger commit here to guarantee atomicity.
        if (inspection.passedQty > 0) {
           await this.ledgerService.recordMovement(tenantId, {
             variantId: grnItem.variantId,
             warehouseId: grn.warehouseId,
             binId: (grnItem.binId || '') as any,
             type: 'IN' as any,
             quantity: inspection.passedQty,
             referenceType: 'GRN',
             referenceId: grnId
           }, userId, tx);
        }
      }

      // Update PO Status
      await tx.purchaseOrder.update({
        where: { id: grn.poId },
        data: { status: fullyReceived ? 'COMPLETED' : 'PARTIAL_RECEIVED' }
      });

      // Update GRN Status
      return tx.goodsReceipt.update({
        where: { id: grnId },
        data: { status: 'RECEIVED' }
      });
    });
  }
}

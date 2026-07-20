import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../../inventory/ledger/ledger.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class FulfillmentService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService
  ) {}

  private async logAudit(tx: any, tenantId: string, action: string, refType: string, refId: string, userId: string) {
    await tx.fulfillmentAuditLog.create({
      data: {
        id: uuidv7(),
        tenantId,
        action,
        referenceType: refType,
        referenceId: refId,
        userId
      }
    });
  }

  // --- PICK ENGINE ---
  async generatePickList(tenantId: string, orderId: string, userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId, tenantId },
        include: { items: true }
      });
      if (!order || order.status !== 'RESERVED') throw new BadRequestException('Order must be in RESERVED state to pick');

      const pickListId = uuidv7();
      const pickList = await tx.pickList.create({
        data: {
          id: pickListId,
          tenantId,
          orderId,
          assignedTo: userId,
          status: 'PICKING'
        }
      });

      for (const item of order.items) {
        if (Number(item.reservedQty) > 0) {
          // Find the bins where this stock is physically located
          const stock = await tx.currentStock.findFirst({
            where: { tenantId, variantId: item.variantId, reservedQty: { gte: item.reservedQty } }
          });
          
          if (!stock) throw new BadRequestException(`No physical bin mapping found for variant ${item.variantId}`);

          await tx.pickListItem.create({
            data: {
              id: uuidv7(),
              pickListId,
              orderItemId: item.id,
              variantId: item.variantId,
              binId: stock.binId || '', // Using the found physical bin
              expectedQty: item.reservedQty,
              pickedQty: 0
            }
          });
        }
      }

      await this.logAudit(tx, tenantId, 'PICK_STARTED', 'SALES_ORDER', orderId, userId);
      return pickList;
    });
  }

  async completePickList(tenantId: string, pickListId: string, updates: any[], userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const pickList = await tx.pickList.findUnique({
        where: { id: pickListId, tenantId },
        include: { items: true, order: true }
      });

      let hasShortPick = false;

      for (const update of updates) {
        if (!pickList) throw new Error();
        const item = pickList.items.find((i: any) => i.id === update.pickListItemId);
        if (!item) continue;

        const picked = Number(update.pickedQty);
        const expected = Number(item.expectedQty);
        let shortPickQty = 0;
        
        if (picked < expected) {
          shortPickQty = expected - picked;
          hasShortPick = true;
        }

        await tx.pickListItem.update({
          where: { id: item.id },
          data: { 
            pickedQty: picked,
            shortPickQty,
            shortPickReason: update.shortPickReason
          }
        });
      }

      await tx.pickList.update({
        where: { id: pickListId },
        data: { status: 'COMPLETED' }
      });

      if (hasShortPick) {
        // Pending Fulfillment workflow (as per CTO mandate)
        await tx.salesOrder.update({
          where: { id: pickList!.orderId },
          data: { status: 'PARTIALLY_FULFILLED' } // Business handles the rest
        });
      }

      if (!pickList) throw new Error();
      await this.logAudit(tx, tenantId, 'PICK_COMPLETED', 'SALES_ORDER', pickList.orderId, userId);
      return { success: true, hasShortPick };
    });
  }

  // --- PACK ENGINE ---
  async packItems(tenantId: string, orderId: string, boxes: any[], userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const pickList = await tx.pickList.findFirst({
        where: { tenantId, orderId, status: 'COMPLETED' },
        include: { items: true }
      });
      if (!pickList) throw new BadRequestException('No completed PickList found for Order');

      // Packing Verification logic
      let totalPackedQty = 0;
      let totalPickedQty = pickList.items.reduce((sum: number, i: any) => sum + Number(i.pickedQty), 0);

      const slipId = uuidv7();
      await tx.packingSlip.create({
        data: { id: slipId, tenantId, orderId, status: 'PACKING' }
      });

      for (const box of boxes) {
        const items = box.items; // array of { orderItemId, packedQty }
        const packedInBox = items.reduce((sum: number, i: any) => sum + Number(i.packedQty), 0);
        totalPackedQty += packedInBox;

        await tx.packingBox.create({
          data: {
            id: uuidv7(),
            packingSlipId: slipId,
            boxNumber: box.boxNumber,
            items: box.items
          }
        });
      }

      if (totalPackedQty !== totalPickedQty) {
        throw new BadRequestException(`PACKING VERIFICATION FAILED: Picked ${totalPickedQty}, but Packed ${totalPackedQty}`);
      }

      await tx.packingSlip.update({
        where: { id: slipId },
        data: { status: 'VERIFIED' }
      });

      await this.logAudit(tx, tenantId, 'PACKED_VERIFIED', 'SALES_ORDER', orderId, userId);
      return { slipId };
    });
  }

  // --- SHIP ENGINE ---
  async createShipment(tenantId: string, packingSlipId: string, transporterId: string, userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const slip = await tx.packingSlip.findUnique({
        where: { id: packingSlipId, tenantId },
        include: { order: true }
      });

      if (!slip || slip.status !== 'VERIFIED') throw new BadRequestException('Packing slip not verified');

      const shipmentId = uuidv7();
      const shipment = await tx.shipment.create({
        data: {
          id: shipmentId,
          tenantId,
          orderId: slip.orderId,
          packingSlipId,
          transporterId,
          status: 'READY'
        }
      });

      await this.logAudit(tx, tenantId, 'SHIPMENT_CREATED', 'SHIPMENT', shipmentId, userId);
      return shipment;
    });
  }

  async dispatchShipment(tenantId: string, shipmentId: string, lrNumber: string, carrierTrackingId: string, userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({
        where: { id: shipmentId, tenantId },
        include: { order: { include: { items: true } }, packingSlip: true }
      });

      if (!shipment) throw new NotFoundException();
      if (shipment.status !== 'READY') throw new BadRequestException('Shipment cannot be dispatched. Current status: ' + shipment.status);

      // 1. Ledger Interaction (Immutable Dependency)
      const pickList = await tx.pickList.findFirst({
        where: { orderId: shipment.orderId, tenantId },
        include: { items: true }
      });

      if (!pickList) throw new Error();
      for (const item of pickList.items) {
        if (Number(item.pickedQty) > 0) {
          // Release reservation
          await this.ledgerService.releaseReservation(tenantId, {
            variantId: item.variantId,
            warehouseId: shipment.order.warehouseId,
            quantity: Number(item.pickedQty),
            referenceId: shipment.orderId
          }, tx);

          // OUT Movement
          await this.ledgerService.recordMovement(tenantId, {
            variantId: item.variantId,
            warehouseId: shipment.order.warehouseId,
            binId: item.binId,
            type: 'OUT' as any,
            quantity: -Number(item.pickedQty), // Negative for out
            referenceType: 'SHIPMENT',
            referenceId: shipmentId
          }, userId, tx);

          // 2. Inventory Snapshot
          await tx.inventorySnapshot.create({
            data: {
              id: uuidv7(),
              tenantId,
              shipmentId,
              warehouseId: shipment.order.warehouseId,
              binId: item.binId,
              variantId: item.variantId,
              reservedQty: item.expectedQty, // What was originally reserved
              dispatchedQty: item.pickedQty
            }
          });

          await tx.shipmentItem.create({
             data: {
               id: uuidv7(),
               shipmentId,
               orderItemId: item.orderItemId,
               variantId: item.variantId,
               dispatchedQty: item.pickedQty
             }
          });
        }
      }

      await tx.shipment.update({
        where: { id: shipmentId },
        data: { 
          status: 'DISPATCHED', 
          lrNumber, 
          carrierTrackingId,
          dispatchedAt: new Date()
        }
      });

      await this.logAudit(tx, tenantId, 'DISPATCHED', 'SHIPMENT', shipmentId, userId);
      return { success: true };
    });
  }

  async holdShipment(tenantId: string, shipmentId: string, userId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
       const shipment = await tx.shipment.findUnique({ where: { id: shipmentId, tenantId } });
       if (shipment!.status === 'DISPATCHED' || shipment!.status === 'DELIVERED') {
          throw new BadRequestException('Cannot hold a dispatched shipment');
       }
       await tx.shipment.update({ where: { id: shipmentId }, data: { status: 'ON_HOLD' } });
       await this.logAudit(tx, tenantId, 'SHIPMENT_HELD', 'SHIPMENT', shipmentId, userId);
       return { success: true };
    });
  }
}

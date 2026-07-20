import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v7 as uuidv7 } from 'uuid';

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER'
}

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append-only ledger execution. Updates CurrentStock atomically.
   */
  async recordMovement(
    tenantId: string, 
    data: {
      variantId: string;
      warehouseId: string;
      binId?: string;
      type: StockMovementType;
      quantity: number; // Positive for IN, Negative for OUT
      referenceType: string;
      referenceId: string;
    },
    userId: string,
    existingTx?: any // Optional transactional context
  ) {
    if (data.type === StockMovementType.OUT && data.quantity > 0) {
      throw new BadRequestException('OUT movements must have negative quantity');
    }
    if (data.type === StockMovementType.IN && data.quantity < 0) {
      throw new BadRequestException('IN movements must have positive quantity');
    }

    const runLogic = async (tx: any) => {
      // We will perform a conditional atomic update
      // Prisma's updateMany allows us to add conditionals on non-unique fields like `availableQty >= qty`

      const binCondition = data.binId || null;

      // Ensure a row exists (upsert 0 if it doesn't) to avoid "row not found" during update
      const existing = await tx.currentStock.findFirst({
        where: {
          variantId: data.variantId,
          warehouseId: data.warehouseId,
          binId: binCondition
        }
      });

      if (!existing) {
        if (data.quantity < 0) {
          throw new BadRequestException('Insufficient stock for this operation');
        }
        await tx.currentStock.create({
          data: {
            id: uuidv7(),
            tenantId,
            variantId: data.variantId,
            warehouseId: data.warehouseId,
            binId: binCondition,
            availableQty: 0
          }
        });
      }

      // Conditional Atomic Update
      let updateResult;
      
      if (data.quantity < 0) {
        // Deduction - needs check
        const deduction = Math.abs(data.quantity);
        const updateInfo = await tx.currentStock.updateMany({
          where: {
            variantId: data.variantId,
            warehouseId: data.warehouseId,
            binId: binCondition,
            availableQty: { gte: deduction } // Database-level conditional check
          },
          data: {
            availableQty: { decrement: deduction }
          }
        });

        if (updateInfo.count === 0) {
          throw new BadRequestException('Insufficient stock for this operation');
        }
      } else {
        // Addition - no check needed
        await tx.currentStock.updateMany({
          where: {
            variantId: data.variantId,
            warehouseId: data.warehouseId,
            binId: binCondition
          },
          data: {
            availableQty: { increment: data.quantity }
          }
        });
      }

      // Read back the exact balance for the ledger entry. 
      // Because we are inside a serializable/read-committed transaction, this read reflects our update.
      const currentStock = await tx.currentStock.findFirstOrThrow({
        where: {
          variantId: data.variantId,
          warehouseId: data.warehouseId,
          binId: binCondition
        }
      });

      const newBalance = currentStock.availableQty;

      // Insert append-only ledger entry
      const ledgerEntry = await tx.stockLedger.create({
        data: {
          id: uuidv7(),
          tenantId,
          variantId: data.variantId,
          warehouseId: data.warehouseId,
          binId: data.binId,
          type: data.type,
          quantity: data.quantity,
          balance: newBalance,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          createdBy: userId
        }
      });

      return ledgerEntry;
    };

    if (existingTx) {
      return runLogic(existingTx);
    }
    return this.prisma.ext.$transaction(runLogic);
  }

  // --- RESERVATION ENGINE ---
  async reserveStock(
    tenantId: string,
    data: {
      variantId: string;
      warehouseId: string;
      quantity: number;
      referenceType?: string;
      referenceId?: string;
    },
    userId?: string,
    existingTx?: any
  ) {
    const runLogic = async (tx: any) => {
      const stock = await tx.currentStock.findFirst({
        where: { tenantId, variantId: data.variantId, warehouseId: data.warehouseId }
      });

      if (!stock || Number(stock.availableQty) < data.quantity) {
        throw new BadRequestException('Insufficient available stock to reserve');
      }

      return tx.currentStock.update({
        where: { id: stock.id },
        data: {
          availableQty: { decrement: data.quantity },
          reservedQty: { increment: data.quantity }
        }
      });
    };
    if (existingTx) return runLogic(existingTx);
    return this.prisma.ext.$transaction(runLogic);
  }

  async releaseReservation(
    tenantId: string,
    data: {
      variantId: string;
      warehouseId: string;
      quantity: number;
      referenceId?: string;
    },
    existingTx?: any
  ) {
    const runLogic = async (tx: any) => {
      const stock = await tx.currentStock.findFirst({
        where: { tenantId, variantId: data.variantId, warehouseId: data.warehouseId }
      });

      if (!stock || Number(stock.reservedQty) < data.quantity) {
        throw new BadRequestException('Insufficient reserved stock to release');
      }

      return tx.currentStock.update({
        where: { id: stock.id },
        data: {
          reservedQty: { decrement: data.quantity },
          availableQty: { increment: data.quantity }
        }
      });
    };
    if (existingTx) return runLogic(existingTx);
    return this.prisma.ext.$transaction(runLogic);
  }
}

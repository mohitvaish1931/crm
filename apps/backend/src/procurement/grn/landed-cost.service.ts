import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class LandedCostService {
  constructor(private prisma: PrismaService) {}

  async allocateLandedCost(tenantId: string, grnId: string, data: any) {
    return this.prisma.ext.$transaction(async (tx) => {
      const grn = await tx.goodsReceipt.findUnique({
        where: { id: grnId, tenantId },
        include: { items: { include: { poItem: true } } }
      });

      if (!grn) throw new NotFoundException('GRN not found');

      // 1. Save Allocation Config
      const allocation = await tx.landedCostAllocation.create({
        data: {
          id: uuidv7(),
          tenantId,
          grnId: grn.id,
          chargeType: data.chargeType,
          amount: data.amount,
          allocationMethod: data.allocationMethod
        }
      });

      // 2. Distribute Logic
      let totalMetric = 0;

      for (const item of grn.items) {
        if (data.allocationMethod === 'BY_QUANTITY') {
          totalMetric += Number(item.acceptedQty);
        } else if (data.allocationMethod === 'BY_VALUE') {
          totalMetric += Number(item.acceptedQty) * Number(item.poItem.unitPrice);
        } else if (data.allocationMethod === 'BY_WEIGHT') {
          // Future integration: fetch weight from variant details
          totalMetric += Number(item.acceptedQty); 
        }
      }

      if (totalMetric > 0 && data.allocationMethod !== 'MANUAL') {
        for (const item of grn.items) {
          let itemMetric = 0;
          if (data.allocationMethod === 'BY_QUANTITY') {
            itemMetric = Number(item.acceptedQty);
          } else if (data.allocationMethod === 'BY_VALUE') {
            itemMetric = Number(item.acceptedQty) * Number(item.poItem.unitPrice);
          } else if (data.allocationMethod === 'BY_WEIGHT') {
            itemMetric = Number(item.acceptedQty);
          }

          const shareRatio = itemMetric / totalMetric;
          const allocatedAmount = Number(data.amount) * shareRatio;
          const unitAllocatedCost = allocatedAmount / Number(item.acceptedQty);

          const finalUnitCost = Number(item.poItem.unitPrice) + unitAllocatedCost;

          // Update Price History hook (upsert)
          await tx.productSupplierPriceHistory.upsert({
            where: {
              supplierId_variantId: { supplierId: grn.supplierId, variantId: item.variantId }
            },
            create: {
              id: uuidv7(),
              tenantId,
              supplierId: grn.supplierId,
              variantId: item.variantId,
              lastPurchasePrice: finalUnitCost,
              avgPurchasePrice: finalUnitCost,
              lowestPrice: finalUnitCost,
              highestPrice: finalUnitCost,
              lastPurchaseDate: new Date()
            },
            update: {
              lastPurchasePrice: finalUnitCost,
              // basic naive moving average for demonstration
              avgPurchasePrice: { set: finalUnitCost }, 
              lastPurchaseDate: new Date()
            }
          });
        }
      }

      return allocation;
    });
  }
}

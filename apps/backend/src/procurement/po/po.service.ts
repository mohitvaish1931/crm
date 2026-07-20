import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v7 as uuidv7 } from 'uuid';

export const PoStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  ON_HOLD: 'ON_HOLD',
  PARTIAL_RECEIVED: 'PARTIAL_RECEIVED',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED'
};

@Injectable()
export class PoService {
  constructor(private prisma: PrismaService) {}

  async createPurchaseRequisition(tenantId: string, userId: string, data: any) {
    return this.prisma.ext.$transaction(async (tx) => {
      const prId = uuidv7();
      
      const pr = await tx.purchaseRequisition.create({
        data: {
          id: prId,
          tenantId,
          prNumber: `PR-${Date.now()}`,
          requestedBy: userId,
          status: 'DRAFT',
          notes: data.notes
        }
      });

      await tx.purchaseRequisitionItem.createMany({
        data: data.items.map((item: any) => ({
          id: uuidv7(),
          prId,
          variantId: item.variantId,
          uomId: item.uomId,
          quantity: item.quantity,
          expectedDate: item.expectedDate ? new Date(item.expectedDate) : null
        }))
      });

      return pr;
    });
  }

  // PR to PO Conversion Logic
  async convertPrToPo(tenantId: string, prId: string, userId: string, supplierId: string, warehouseId: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const pr = await tx.purchaseRequisition.findUnique({
        where: { id: prId, tenantId },
        include: { items: true }
      });

      if (!pr) throw new NotFoundException('PR not found');
      if (pr.status !== 'APPROVED') throw new BadRequestException('Only approved PRs can be converted to PO');

      const poId = uuidv7();
      
      const po = await tx.purchaseOrder.create({
        data: {
          id: poId,
          tenantId,
          poNumber: `PO-${Date.now()}`,
          supplierId,
          warehouseId,
          createdBy: userId,
          status: PoStatus.DRAFT,
          notes: `Generated from PR: ${pr.prNumber}`
        }
      });

      // Simple implementation: missing exact supplier pricing logic here (would fetch from history)
      await tx.purchaseOrderItem.createMany({
        data: pr.items.map(item => ({
          id: uuidv7(),
          poId,
          variantId: item.variantId,
          uomId: item.uomId,
          quantity: item.quantity,
          receivedQty: 0,
          unitPrice: 0, // Must be filled by Procurement Officer
          taxRate: 0,
          totalAmount: 0
        }))
      });

      await tx.purchaseRequisition.update({
        where: { id: prId },
        data: { status: 'CONVERTED' }
      });

      return po;
    });
  }

  // --- Multi-Level Approval Engine ---
  async requestApproval(tenantId: string, poId: string) {
    const po = await this.prisma.ext.purchaseOrder.findUnique({
      where: { id: poId, tenantId }
    });

    if (!po || po.status !== PoStatus.DRAFT) {
      throw new BadRequestException('PO must be in DRAFT state to request approval');
    }

    // Move to PENDING_APPROVAL
    return this.prisma.ext.purchaseOrder.update({
      where: { id: poId },
      data: { status: PoStatus.PENDING_APPROVAL }
    });
  }

  async approvePo(tenantId: string, poId: string, approverUserId: string, approverRole: string) {
    const po = await this.prisma.ext.purchaseOrder.findUnique({
      where: { id: poId, tenantId }
    });

    if (!po || po.status !== PoStatus.PENDING_APPROVAL) {
      throw new BadRequestException('PO is not pending approval');
    }

    // Configurable thresholds logic (Hardcoded for demonstration, ideally from tenant settings)
    const amount = Number(po.totalAmount);
    let requiredRole = 'MANAGER';
    if (amount > 500000) requiredRole = 'OWNER';
    else if (amount > 50000) requiredRole = 'FINANCE'; // Simplified hierarchy: MANAGER -> FINANCE -> OWNER

    // Extremely basic RBAC check string matching
    if (requiredRole === 'OWNER' && approverRole !== 'OWNER') {
      throw new ConflictException(`Amount requires ${requiredRole} approval.`);
    }

    return this.prisma.ext.purchaseOrder.update({
      where: { id: poId },
      data: { 
        status: PoStatus.APPROVED,
        approvedBy: approverUserId
      }
    });
  }

  async changeStatus(tenantId: string, poId: string, newStatus: string) {
    const validTransitions: Record<string, string[]> = {
      [PoStatus.APPROVED]: [PoStatus.ON_HOLD, PoStatus.CANCELLED],
      [PoStatus.ON_HOLD]: [PoStatus.APPROVED, PoStatus.CANCELLED],
      [PoStatus.COMPLETED]: [PoStatus.CLOSED]
    };

    const po = await this.prisma.ext.purchaseOrder.findUnique({ where: { id: poId, tenantId } });
    if (!po) throw new NotFoundException();

    const allowed = validTransitions[po.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${po.status} to ${newStatus}`);
    }

    return this.prisma.ext.purchaseOrder.update({
      where: { id: poId },
      data: { status: newStatus }
    });
  }

  // Analytics Hook Stub
  async generatePriceAlerts(tenantId: string, supplierId: string, variantId: string, currentPrice: number) {
    // In future, this hits Procurement Insights Engine AI
    const history = await this.prisma.ext.productSupplierPriceHistory.findUnique({
      where: { supplierId_variantId: { supplierId, variantId } }
    });

    if (history && history.avgPurchasePrice && currentPrice > Number(history.avgPurchasePrice) * 1.05) {
      return `Price is 5% higher than historical average of ${history.avgPurchasePrice}`;
    }
    return null;
  }
}

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v7 as uuidv7 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async createSupplier(tenantId: string, data: any) {
    // Check duplicate CODE, GST, or PAN
    const existing = await this.prisma.ext.supplier.findFirst({
      where: {
        tenantId,
        OR: [
          { code: data.code },
          ...(data.gst ? [{ gst: data.gst }] : []),
          ...(data.pan ? [{ pan: data.pan }] : [])
        ]
      }
    });

    if (existing) {
      throw new ConflictException('Supplier with this Code, GST, or PAN already exists.');
    }

    const supplierId = uuidv7();

    return this.prisma.ext.$transaction(async (tx) => {
      const supplier = await tx.supplier.create({
        data: {
          id: supplierId,
          tenantId,
          code: data.code,
          name: data.name,
          gst: data.gst,
          pan: data.pan,
          creditDays: data.creditDays || 0,
          paymentTerms: data.paymentTerms,
          status: 'ACTIVE'
        }
      });

      // Default Performance Record
      await tx.supplierPerformance.create({
        data: {
          supplierId: supplier.id,
          tenantId
        }
      });

      if (data.contacts && data.contacts.length > 0) {
        await tx.supplierContact.createMany({
          data: data.contacts.map((c: any) => ({
            id: uuidv7(),
            supplierId: supplier.id,
            ...c
          }))
        });
      }

      if (data.addresses && data.addresses.length > 0) {
        await tx.supplierAddress.createMany({
          data: data.addresses.map((a: any) => ({
            id: uuidv7(),
            supplierId: supplier.id,
            ...a
          }))
        });
      }

      return supplier;
    });
  }

  // --- Duplicate Invoice Detection ---
  // Calculates a secure hash of [tenantId, supplierId, date, amount] to prevent duplicate invoice entries across GRNs
  generateInvoiceHash(tenantId: string, supplierId: string, invoiceDate: string, amount: number): string {
    const raw = `${tenantId}:${supplierId}:${invoiceDate}:${amount.toFixed(2)}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async checkDuplicateInvoice(tenantId: string, supplierId: string, invoiceDate: string, amount: number): Promise<boolean> {
    const hash = this.generateInvoiceHash(tenantId, supplierId, invoiceDate, amount);
    const existing = await this.prisma.ext.goodsReceipt.findFirst({
      where: { tenantId, invoiceHash: hash }
    });
    return !!existing;
  }
}

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  // --- WAREHOUSE ---
  async createWarehouse(tenantId: string, branchId: string, name: string, isDefault: boolean = false) {
    const existing = await this.prisma.ext.warehouse.findFirst({
      where: { tenantId, name }
    });
    if (existing) throw new ConflictException('Warehouse with this name already exists');

    return this.prisma.ext.$transaction(async (tx) => {
      if (isDefault) {
        await tx.warehouse.updateMany({
          where: { tenantId, branchId },
          data: { isDefault: false }
        });
      }

      return tx.warehouse.create({
        data: {
          id: uuidv7(),
          tenantId,
          branchId,
          name,
          isDefault
        }
      });
    });
  }

  async getWarehouses(tenantId: string, branchId?: string) {
    return this.prisma.ext.warehouse.findMany({
      where: { 
        tenantId,
        ...(branchId && { branchId })
      },
      include: {
        zones: true
      }
    });
  }

  // --- ZONE ---
  async createZone(tenantId: string, warehouseId: string, name: string, type: string = 'STORAGE') {
    const existing = await this.prisma.ext.zone.findUnique({
      where: { warehouseId_name: { warehouseId, name } }
    });
    if (existing) throw new ConflictException('Zone name must be unique per warehouse');

    return this.prisma.ext.zone.create({
      data: {
        id: uuidv7(),
        tenantId,
        warehouseId,
        name,
        type
      }
    });
  }

  // --- RACK ---
  async createRack(tenantId: string, zoneId: string, name: string) {
    const existing = await this.prisma.ext.rack.findUnique({
      where: { zoneId_name: { zoneId, name } }
    });
    if (existing) throw new ConflictException('Rack name must be unique per zone');

    return this.prisma.ext.rack.create({
      data: {
        id: uuidv7(),
        tenantId,
        zoneId,
        name
      }
    });
  }

  // --- BIN ---
  async createBin(tenantId: string, rackId: string, name: string, barcode?: string) {
    const existing = await this.prisma.ext.bin.findUnique({
      where: { rackId_name: { rackId, name } }
    });
    if (existing) throw new ConflictException('Bin name must be unique per rack');

    return this.prisma.ext.bin.create({
      data: {
        id: uuidv7(),
        tenantId,
        rackId,
        name,
        barcode: barcode || `${rackId.slice(-4)}-${name}` // Simple fallback barcode generator
      }
    });
  }

  async getWarehouseTopology(tenantId: string, warehouseId: string) {
    return this.prisma.ext.warehouse.findUnique({
      where: { id: warehouseId, tenantId },
      include: {
        zones: {
          include: {
            racks: {
              include: {
                bins: true
              }
            }
          }
        }
      }
    });
  }
}

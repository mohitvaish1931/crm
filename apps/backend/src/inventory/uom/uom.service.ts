import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class UomService {
  constructor(private readonly prisma: PrismaService) {}

  async createUom(tenantId: string, code: string, name: string, isFractional: boolean) {
    const existing = await this.prisma.ext.uom.findUnique({
      where: { tenantId_code: { tenantId, code } }
    });
    if (existing) throw new ConflictException(`UOM code ${code} already exists`);

    return this.prisma.ext.uom.create({
      data: {
        id: uuidv7(),
        tenantId,
        code,
        name,
        isFractional
      }
    });
  }

  async getUoms(tenantId: string) {
    return this.prisma.ext.uom.findMany({
      where: { tenantId }
    });
  }

  async addConversion(tenantId: string, baseUomId: string, targetUomId: string, multiplier: number) {
    const existing = await this.prisma.ext.uomConversion.findUnique({
      where: { baseUomId_targetUomId: { baseUomId, targetUomId } }
    });
    if (existing) throw new ConflictException('Conversion already exists between these UOMs');

    return this.prisma.ext.uomConversion.create({
      data: {
        id: uuidv7(),
        tenantId,
        baseUomId,
        targetUomId,
        multiplier
      }
    });
  }
}

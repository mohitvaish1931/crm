import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class ClassificationService {
  constructor(private readonly prisma: PrismaService) {}

  // --- CATEGORY ---
  async createCategory(tenantId: string, name: string, parentId?: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.prisma.ext.category.findUnique({
      where: { tenantId_slug: { tenantId, slug } }
    });
    if (existing) throw new ConflictException(`Category slug ${slug} already exists`);

    return this.prisma.ext.category.create({
      data: {
        id: uuidv7(),
        tenantId,
        name,
        slug,
        parentId
      }
    });
  }

  async getCategoriesTree(tenantId: string) {
    return this.prisma.ext.category.findMany({
      where: { tenantId, parentId: null },
      include: {
        children: {
          include: {
            children: true // Goes down 3 levels
          }
        }
      }
    });
  }

  // --- BRAND ---
  async createBrand(tenantId: string, name: string) {
    const existing = await this.prisma.ext.brand.findUnique({
      where: { tenantId_name: { tenantId, name } }
    });
    if (existing) throw new ConflictException(`Brand ${name} already exists`);

    return this.prisma.ext.brand.create({
      data: {
        id: uuidv7(),
        tenantId,
        name
      }
    });
  }

  async getBrands(tenantId: string) {
    return this.prisma.ext.brand.findMany({
      where: { tenantId }
    });
  }

  // --- COLLECTION ---
  async createCollection(tenantId: string, name: string) {
    const existing = await this.prisma.ext.collection.findUnique({
      where: { tenantId_name: { tenantId, name } }
    });
    if (existing) throw new ConflictException(`Collection ${name} already exists`);

    return this.prisma.ext.collection.create({
      data: {
        id: uuidv7(),
        tenantId,
        name
      }
    });
  }

  async getCollections(tenantId: string) {
    return this.prisma.ext.collection.findMany({
      where: { tenantId }
    });
  }
}

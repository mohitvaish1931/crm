import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  // --- DYNAMIC ATTRIBUTES ---
  async createAttribute(tenantId: string, name: string, type: string = 'TEXT') {
    const existing = await this.prisma.ext.attribute.findUnique({
      where: { tenantId_name: { tenantId, name } }
    });
    if (existing) throw new ConflictException(`Attribute ${name} already exists`);

    return this.prisma.ext.attribute.create({
      data: { id: uuidv7(), tenantId, name, type }
    });
  }

  async addAttributeValue(tenantId: string, attributeId: string, value: string, meta?: string) {
    const existing = await this.prisma.ext.attributeValue.findUnique({
      where: { attributeId_value: { attributeId, value } }
    });
    if (existing) throw new ConflictException(`Value ${value} already exists for this attribute`);

    return this.prisma.ext.attributeValue.create({
      data: { id: uuidv7(), tenantId, attributeId, value, meta }
    });
  }

  // --- PRODUCTS ---
  async createProduct(tenantId: string, data: {
    name: string;
    categoryId: string;
    uomId: string;
    baseSku: string;
    brandId?: string;
    type?: string;
    hasVariants?: boolean;
  }) {
    const existing = await this.prisma.ext.product.findUnique({
      where: { tenantId_baseSku: { tenantId, baseSku: data.baseSku } }
    });
    if (existing) throw new ConflictException(`Product with Base SKU ${data.baseSku} already exists`);

    return this.prisma.ext.product.create({
      data: {
        id: uuidv7(),
        tenantId,
        name: data.name,
        categoryId: data.categoryId,
        uomId: data.uomId,
        baseSku: data.baseSku,
        brandId: data.brandId,
        type: data.type || 'STANDARD',
        hasVariants: data.hasVariants || false
      }
    });
  }

  // --- VARIANT & SKU ENGINE ---
  async generateVariantSku(tenantId: string, productId: string, attributeValueIds: string[]) {
    const product = await this.prisma.ext.product.findUnique({ where: { id: productId, tenantId } });
    if (!product) throw new ConflictException('Product not found');

    const attrValues = await this.prisma.ext.attributeValue.findMany({
      where: { id: { in: attributeValueIds } }
    });

    const attrSnippets = attrValues.map(a => a.value.substring(0, 3).toUpperCase());
    const prefix = `${product.baseSku}-${attrSnippets.join('-')}`;
    const year = new Date().getFullYear();
    
    // Atomic upsert for SkuSequence
    const seqRecord = await this.prisma.ext.skuSequence.upsert({
      where: { tenantId_prefix_year: { tenantId, prefix, year } },
      create: {
        tenantId,
        prefix,
        year,
        currentVal: 1
      },
      update: {
        currentVal: { increment: 1 }
      }
    });
    
    const seq = String(seqRecord.currentVal).padStart(4, '0');
    return `${prefix}-${year}-${seq}`;
  }

  async addVariant(tenantId: string, productId: string, attributeValueIds: string[], price: number = 0, cost: number = 0) {
    const generatedSku = await this.generateVariantSku(tenantId, productId, attributeValueIds);

    return this.prisma.ext.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          id: uuidv7(),
          tenantId,
          productId,
          sku: generatedSku,
          price,
          cost
        }
      });

      // Map Attributes
      if (attributeValueIds.length > 0) {
        await tx.variantAttribute.createMany({
          data: attributeValueIds.map(valId => ({
            variantId: variant.id,
            attributeValueId: valId
          }))
        });
      }

      return variant;
    });
  }
}

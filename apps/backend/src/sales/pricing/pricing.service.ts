import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PricingEngineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Evaluates the best price for a customer for a given product variant.
   * Priority:
   * 1. CustomerPricingRule (Explicit override)
   * 2. Active DiscountRules (Category/Product/Customer specific) applied to base price
   * 3. Fallback to base product price
   */
  async getSuggestedPrice(tenantId: string, customerId: string, variantId: string): Promise<number> {
    // 1. Check for explicit customer pricing override
    const rule = await this.prisma.ext.customerPricingRule.findUnique({
      where: { customerId_variantId: { customerId, variantId } }
    });

    if (rule) return Number(rule.customPrice);

    // 2. Fetch Base Price
    const variant = await this.prisma.ext.productVariant.findUniqueOrThrow({
      where: { id: variantId, tenantId },
      include: { product: true }
    });
    
    // In a real implementation, base price comes from the product variant configuration.
    // For this simulation, assuming base price is retrieved or defaults to 0.
    // We will use 0 for now as standard price isn't strictly defined in early sprints.
    let basePrice = 0; // Replace with variant.sellingPrice if it existed

    // 3. Fetch Applicable Discounts
    const activeDiscounts = await this.prisma.ext.discountRule.findMany({
      where: { 
        tenantId, 
        active: true,
        OR: [
          { type: 'CUSTOMER', targetId: customerId },
          { type: 'PRODUCT', targetId: variantId }
          // Category/Festival logic can be expanded here
        ]
      }
    });

    let maxDiscountPct = 0;
    for (const discount of activeDiscounts) {
      if (Number(discount.discountPct) > maxDiscountPct) {
        maxDiscountPct = Number(discount.discountPct);
      }
    }

    const finalPrice = basePrice * (1 - (maxDiscountPct / 100));
    return finalPrice;
  }

  async getCustomerPriceHistory(tenantId: string, customerId: string, variantId: string) {
    const history = await this.prisma.ext.customerPriceHistory.findUnique({
      where: { customerId_variantId: { customerId, variantId } }
    });

    if (!history) throw new NotFoundException('No previous price history for this variant');
    
    return history;
  }
}

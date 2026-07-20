import { Controller, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../iam/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import type { Request } from 'express';

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @RequirePermissions('product.create')
  @Post()
  async createProduct(@Req() req: Request, @Body() body: any) {
    const user = req.user as any;
    return this.productService.createProduct(user.tenantId, body);
  }

  @RequirePermissions('product.create')
  @Post(':productId/variants')
  async addVariant(
    @Req() req: Request, 
    @Param('productId') productId: string, 
    @Body() body: { attributeValueIds: string[], price?: number, cost?: number }
  ) {
    const user = req.user as any;
    return this.productService.addVariant(
      user.tenantId, 
      productId, 
      body.attributeValueIds, 
      body.price, 
      body.cost
    );
  }

  // --- ATTRIBUTES ---
  @RequirePermissions('attribute.create')
  @Post('attributes')
  async createAttribute(@Req() req: Request, @Body() body: { name: string, type?: string }) {
    const user = req.user as any;
    return this.productService.createAttribute(user.tenantId, body.name, body.type);
  }

  @RequirePermissions('attribute.create')
  @Post('attributes/:attributeId/values')
  async addAttributeValue(
    @Req() req: Request, 
    @Param('attributeId') attributeId: string, 
    @Body() body: { value: string, meta?: string }
  ) {
    const user = req.user as any;
    return this.productService.addAttributeValue(user.tenantId, attributeId, body.value, body.meta);
  }
}

import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../iam/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import type { Request } from 'express';

@Controller('classification')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  @RequirePermissions('category.create')
  @Post('categories')
  async createCategory(@Req() req: Request, @Body() body: { name: string, parentId?: string }) {
    const user = req.user as any;
    return this.classificationService.createCategory(user.tenantId, body.name, body.parentId);
  }

  @RequirePermissions('category.read')
  @Get('categories')
  async getCategories(@Req() req: Request) {
    const user = req.user as any;
    return this.classificationService.getCategoriesTree(user.tenantId);
  }

  @RequirePermissions('brand.create')
  @Post('brands')
  async createBrand(@Req() req: Request, @Body() body: { name: string }) {
    const user = req.user as any;
    return this.classificationService.createBrand(user.tenantId, body.name);
  }

  @RequirePermissions('brand.read')
  @Get('brands')
  async getBrands(@Req() req: Request) {
    const user = req.user as any;
    return this.classificationService.getBrands(user.tenantId);
  }

  @RequirePermissions('collection.create')
  @Post('collections')
  async createCollection(@Req() req: Request, @Body() body: { name: string }) {
    const user = req.user as any;
    return this.classificationService.createCollection(user.tenantId, body.name);
  }

  @RequirePermissions('collection.read')
  @Get('collections')
  async getCollections(@Req() req: Request) {
    const user = req.user as any;
    return this.classificationService.getCollections(user.tenantId);
  }
}

import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../iam/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import type { Request } from 'express';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @RequirePermissions('warehouse.create')
  @Post()
  async createWarehouse(@Req() req: Request, @Body() body: { branchId: string, name: string, isDefault?: boolean }) {
    const user = req.user as any;
    return this.warehouseService.createWarehouse(user.tenantId, body.branchId, body.name, body.isDefault);
  }

  @RequirePermissions('warehouse.read')
  @Get()
  async getWarehouses(@Req() req: Request, @Query('branchId') branchId?: string) {
    const user = req.user as any;
    return this.warehouseService.getWarehouses(user.tenantId, branchId);
  }

  @RequirePermissions('warehouse.create')
  @Post(':warehouseId/zones')
  async createZone(@Req() req: Request, @Param('warehouseId') warehouseId: string, @Body() body: { name: string, type?: string }) {
    const user = req.user as any;
    return this.warehouseService.createZone(user.tenantId, warehouseId, body.name, body.type);
  }

  @RequirePermissions('warehouse.create')
  @Post('zones/:zoneId/racks')
  async createRack(@Req() req: Request, @Param('zoneId') zoneId: string, @Body() body: { name: string }) {
    const user = req.user as any;
    return this.warehouseService.createRack(user.tenantId, zoneId, body.name);
  }

  @RequirePermissions('warehouse.create')
  @Post('racks/:rackId/bins')
  async createBin(@Req() req: Request, @Param('rackId') rackId: string, @Body() body: { name: string, barcode?: string }) {
    const user = req.user as any;
    return this.warehouseService.createBin(user.tenantId, rackId, body.name, body.barcode);
  }

  @RequirePermissions('warehouse.read')
  @Get(':warehouseId/topology')
  async getTopology(@Req() req: Request, @Param('warehouseId') warehouseId: string) {
    const user = req.user as any;
    return this.warehouseService.getWarehouseTopology(user.tenantId, warehouseId);
  }
}

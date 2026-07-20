import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UomService } from './uom.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../iam/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../iam/guards/permissions.guard';
import type { Request } from 'express';

@Controller('uoms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UomController {
  constructor(private readonly uomService: UomService) {}

  @RequirePermissions('uom.create')
  @Post()
  async createUom(@Req() req: Request, @Body() body: { code: string, name: string, isFractional?: boolean }) {
    const user = req.user as any;
    return this.uomService.createUom(user.tenantId, body.code.toUpperCase(), body.name, body.isFractional || false);
  }

  @RequirePermissions('uom.read')
  @Get()
  async getUoms(@Req() req: Request) {
    const user = req.user as any;
    return this.uomService.getUoms(user.tenantId);
  }

  @RequirePermissions('uom.create')
  @Post('conversions')
  async addConversion(@Req() req: Request, @Body() body: { baseUomId: string, targetUomId: string, multiplier: number }) {
    const user = req.user as any;
    return this.uomService.addConversion(user.tenantId, body.baseUomId, body.targetUomId, body.multiplier);
  }
}

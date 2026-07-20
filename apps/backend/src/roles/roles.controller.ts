import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../iam/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import type { Request } from 'express';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @RequirePermissions('roles.create')
  @Post()
  async createRole(@Req() req: Request, @Body() body: { name: string, description: string, permissionIds: string[] }) {
    const user = req.user as any;
    return this.rolesService.createRole(user.tenantId, body.name, body.description, body.permissionIds);
  }

  @RequirePermissions('roles.read')
  @Get()
  async getRoles(@Req() req: Request) {
    const user = req.user as any;
    return this.rolesService.getRoles(user.tenantId);
  }

  @RequirePermissions('roles.assign')
  @Post('assign')
  async assignRole(@Req() req: Request, @Body() body: { userId: string, roleId: string }) {
    const user = req.user as any;
    return this.rolesService.assignRoleToUser(user.tenantId, body.userId, body.roleId);
  }
}

import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../iam/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import type { Request } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermissions('users.read')
  @Get()
  async listUsers(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.listUsers(user.tenantId);
  }

  @RequirePermissions('users.create')
  @Post('invite')
  async inviteUser(
    @Req() req: Request, 
    @Body() body: { email: string, roleId: string }
  ) {
    const user = req.user as any;
    return this.usersService.inviteUser(user.tenantId, body.email, body.roleId, user.userId);
  }
}

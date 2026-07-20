import { Controller, Get, Put, Body, UseGuards, Req, Res, Headers } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../iam/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import type { Request, Response } from 'express';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @RequirePermissions('settings.read')
  @Get()
  async getSettings(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as any;
    const settings = await this.settingsService.getSettings(user.tenantId);
    
    // ETag Generation
    const etag = `W/"${settings.version}"`;
    res.setHeader('ETag', etag);
    
    // If frontend sends If-None-Match, express handles 304 automatically if we use res.send,
    // but in Nest we just return JSON. A custom interceptor would handle 304 perfectly.
    return settings;
  }

  @RequirePermissions('settings.update')
  @Put()
  async updateSettings(
    @Req() req: Request, 
    @Body() body: any,
    @Headers('if-match') ifMatch: string
  ) {
    const user = req.user as any;
    return this.settingsService.updateSettings(user.tenantId, body, ifMatch, user.userId);
  }
}

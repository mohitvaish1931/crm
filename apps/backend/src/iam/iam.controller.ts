import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { IamService } from './iam.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming this exists
import type { Request, Response } from 'express';

@Controller('iam')
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @UseGuards(JwtAuthGuard)
  @Get('discovery')
  async discoverCapabilities(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    
    // 1. Get Effective Permissions & Hash
    const { permissions, hash } = await this.iamService.getEffectivePermissions(user.tenantId, user.userId);

    // 2. Mocking features for now (would come from Tenant/Settings model in reality)
    const features = ['FEATURE_AI_INSIGHTS'];

    // 3. Mocking Navigation based on permissions (Frontend could also do this, but BFF can help)
    const navigation = [];
    if (permissions.includes('inventory.read') || permissions.includes('*.all')) {
      navigation.push({ name: 'Inventory', path: '/inventory' });
    }
    if (permissions.includes('sales.read') || permissions.includes('*.all')) {
      navigation.push({ name: 'Sales', path: '/sales' });
    }
    
    // Add custom headers as requested by CTO
    res.setHeader('X-Permission-Version', hash);
    const requestId = req.headers['x-request-id'] || req.headers['x-correlation-id'] || 'req-local-dev';
    res.setHeader('X-Request-ID', requestId as string);

    return res.json({
      permissions,
      features,
      navigation
    });
  }
}

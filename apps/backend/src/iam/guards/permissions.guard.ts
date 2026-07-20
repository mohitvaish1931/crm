import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { IamService } from '../iam.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private iamService: IamService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    
    // Assuming JwtAuthGuard has already attached the user payload to request.user
    const user = request.user;
    if (!user || !user.tenantId || !user.userId) {
      throw new ForbiddenException('User context is missing');
    }

    const { permissions } = await this.iamService.getEffectivePermissions(user.tenantId, user.userId);

    // If user has wildcard all-access
    if (permissions.includes('*.all')) {
      return true;
    }

    // Check if user has ALL required permissions
    const hasAll = requiredPermissions.every(rp => {
      // Check wildcard resources like `inventory.*`
      const [resource] = rp.split('.');
      return permissions.includes(rp) || permissions.includes(`${resource}.*`);
    });

    if (!hasAll) {
      throw new ForbiddenException(`Missing required permissions: ${requiredPermissions.join(', ')}`);
    }

    return true;
  }
}

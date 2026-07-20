import { Injectable, UnauthorizedException, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class IamService implements OnModuleDestroy {
  private readonly redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  onModuleDestroy() {
    this.redis.disconnect();
  }

  /**
   * Resolves the effective permissions for a user across all their assigned roles.
   * Employs versioned caching to avoid delete storms.
   */
  async getEffectivePermissions(tenantId: string, userId: string): Promise<{ permissions: string[], hash: string }> {
    // 1. Get the current tenant permission version
    const tenant = await this.prisma.ext.tenant.findUnique({
      where: { id: tenantId },
      select: { version: true }
    });
    
    if (!tenant) throw new UnauthorizedException('Tenant not found');

    const cacheKey = `permissions:${tenantId}:${userId}:v${tenant.version}`;

    // 2. Try Redis Cache first
    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // 3. Cache Miss: Resolve Effective Permissions
    const userRoles = await this.prisma.ext.userRole.findMany({
      where: { tenantId, userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    const permissionSet = new Set<string>();
    
    // Additive Merge
    for (const ur of userRoles) {
      if (ur.role.isSystem) {
        // System roles might have implicit all access, but let's just merge explicitly mapped ones
      }
      for (const rp of ur.role.permissions) {
        permissionSet.add(`${rp.permission.resource}.${rp.permission.action}`);
      }
    }

    const effectivePermissions = Array.from(permissionSet);
    
    // Generate SHA-256 Hash
    const hash = createHash('sha256').update(effectivePermissions.sort().join(',')).digest('hex');
    const result = { permissions: effectivePermissions, hash };

    // Cache it (TTL: 1 hour)
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);

    return result;
  }

  /**
   * Invalidates permissions for a tenant by bumping the version.
   * This leaves old redis keys to TTL expire naturally, preventing delete storms.
   */
  async invalidateTenantPermissions(tenantId: string): Promise<void> {
    await this.prisma.ext.tenant.update({
      where: { id: tenantId },
      data: { version: { increment: 1 } }
    });
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IamService } from '../iam/iam.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly iamService: IamService
  ) {}

  async createRole(tenantId: string, name: string, description: string, permissionIds: string[]) {
    return this.prisma.ext.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          name,
          description,
          isSystem: false,
          permissions: {
            create: permissionIds.map(id => ({
              id: crypto.randomUUID(),
              permissionId: id
            }))
          }
        }
      });
      return role;
    });
  }

  async getRoles(tenantId: string) {
    return this.prisma.ext.role.findMany({
      where: { tenantId },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  }

  async assignRoleToUser(tenantId: string, userId: string, roleId: string) {
    // 1. Verify Role exists for this tenant
    const role = await this.prisma.ext.role.findUnique({
      where: { id: roleId, tenantId }
    });
    if (!role) throw new NotFoundException('Role not found');

    // 2. Assign
    await this.prisma.ext.userRole.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        roleId
      }
    });

    // 3. Invalidate Permissions for this tenant so cache updates
    await this.iamService.invalidateTenantPermissions(tenantId);
    
    return { success: true };
  }
}

import { Injectable, PreconditionFailedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    let settings = await this.prisma.ext.tenantSetting.findUnique({
      where: { tenantId }
    });

    if (!settings) {
      // Seed default settings if missing
      settings = await this.prisma.ext.tenantSetting.create({
        data: {
          id: crypto.randomUUID(),
          tenantId
        }
      });
    }

    return settings;
  }

  async updateSettings(tenantId: string, payload: any, ifMatch: string, updatedBy: string) {
    return this.prisma.ext.$transaction(async (tx) => {
      const current = await tx.tenantSetting.findUnique({
        where: { tenantId }
      });
      if (!current) throw new NotFoundException('Settings not found');

      // Check ETag (Optimistic Locking via version)
      const expectedEtag = `W/"${current.version}"`;
      if (ifMatch && ifMatch !== expectedEtag) {
        throw new PreconditionFailedException('Settings have been updated by another user');
      }

      // Update and bump version
      const updated = await tx.tenantSetting.update({
        where: { tenantId },
        data: {
          ...payload,
          version: { increment: 1 }
        }
      });

      // Record History (Audit)
      await tx.tenantSettingsHistory.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          version: updated.version,
          before: current as any,
          after: updated as any,
          updatedBy
        }
      });

      return updated;
    });
  }
}

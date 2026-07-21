import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { tenantContext } from '../context/tenant-context';

export function getExtendedPrismaClient(prisma: PrismaClient) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenantId = tenantContext.getStore()?.tenantId;
          if (tenantId) {
            const a = args as any;
            if (a.data) {
              if (Array.isArray(a.data)) {
                a.data = a.data.map((d: any) => ({ ...d, tenantId }));
              } else {
                a.data = { ...a.data, tenantId };
              }
              if (a.where) {
                a.where = { ...a.where, tenantId };
              } else {
                a.where = { tenantId };
              }
            }

            // Global Soft Delete Filter
            if (['Tenant', 'User'].includes(model)) {
              const a = args as any;
              const includeDeleted = a?.includeDeleted === true;
              if (a) delete a.includeDeleted; // Strip it so Prisma doesn't complain

              if (!includeDeleted && (operation.startsWith('find') || operation === 'count' || operation === 'aggregate')) {
                if (a.where) {
                  // Only inject if deletedAt wasn't explicitly provided by the caller
                  if (a.where.deletedAt === undefined) {
                    a.where = { ...a.where, deletedAt: null };
                  }
                } else {
                  a.where = { deletedAt: null };
                }
              }
            }

          }
          return query(args);
        },
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof getExtendedPrismaClient>;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public readonly ext: ExtendedPrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      const pool = new Pool({ connectionString });
      const adapter = new PrismaPg(pool);
      super({ adapter });
    } else {
      super();
    }
    this.ext = getExtendedPrismaClient(this);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

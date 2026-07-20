import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { v7 as uuidv7 } from 'uuid';
import { RegisterDto } from '../auth/dto/register.dto';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createTenantAndUser(dto: RegisterDto, tx?: any) {
    const prisma = tx || this.prisma.ext;
    
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: dto.tenantName.toLowerCase().replace(/\s+/g, '-') },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant with this name already exists');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const tenantId = uuidv7();
    const userId = uuidv7();

    const tenant = await prisma.tenant.create({
      data: {
        id: tenantId,
        name: dto.tenantName,
        slug: dto.tenantName.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    const user = await prisma.user.create({
      data: {
        id: userId,
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        passwordHash,
      },
    });

    return { tenant, user };
  }

  async findUserByEmailAndTenant(email: string, tenantSlug: string) {
    const tenant = await this.prisma.ext.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const user = await this.prisma.ext.user.findFirst({
      where: {
        tenantId: tenant.id,
        email,
      },
    });

    return user;
  }

  async listUsers(tenantId: string) {
    return this.prisma.ext.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        // Include effective roles if needed
      }
    });
  }

  async inviteUser(tenantId: string, email: string, roleId: string, createdBy: string) {
    // 1. Check if user already exists
    const existingUser = await this.prisma.ext.user.findFirst({
      where: { tenantId, email }
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists in this tenant');
    }

    // 2. Generate secure token
    const rawToken = crypto.randomUUID(); // In production use crypto.randomBytes
    const tokenHash = await argon2.hash(rawToken, { type: argon2.argon2id });

    // 3. Store invitation
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const invitation = await this.prisma.ext.invitation.create({
      data: {
        id: uuidv7(),
        tenantId,
        email,
        roleId,
        tokenHash,
        expiresAt,
        createdBy
      }
    });

    // In a real app, send email here with rawToken
    // mailService.sendInvite(email, rawToken);

    return { 
      id: invitation.id, 
      status: invitation.status,
      // Only returning rawToken in dev for easy testing
      rawTokenDevOnly: rawToken 
    };
  }
}

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as argon2 from 'argon2';
import { v7 as uuidv7 } from 'uuid';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, deviceInfo: any) {
    return this.prisma.ext.$transaction(async (tx) => {
      const { user, tenant } = await this.usersService.createTenantAndUser(dto, tx);
      return this.generateTokens(user.id, tenant.id, deviceInfo, tx);
    });
  }

  async login(dto: LoginDto, deviceInfo: any) {
    // Constant-time generic error to prevent account enumeration
    const genericError = new UnauthorizedException('Invalid email or password');

    const user = await this.usersService.findUserByEmailAndTenant(dto.email, dto.tenantSlug);
    if (!user) {
      // Perform a dummy hash to prevent timing attacks
      await argon2.verify(await argon2.hash('dummy'), dto.password);
      throw genericError;
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw genericError;
    }

    return this.generateTokens(user.id, user.tenantId, deviceInfo);
  }

  async generateTokens(userId: string, tenantId: string, deviceInfo: any, tx?: any) {
    const prisma = tx || this.prisma.ext;
    const payload = { sub: userId, tenantId };
    const accessToken = this.jwtService.sign(payload);
    
    // Cryptographically secure refresh token
    const refreshTokenPlain = crypto.randomBytes(64).toString('base64url');
    const refreshTokenHash = await argon2.hash(refreshTokenPlain, { type: argon2.argon2id });
    
    // Family ID tracks rotation lineage
    const familyId = uuidv7();

    // 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        id: uuidv7(),
        userId,
        tenantId,
        familyId,
        refreshToken: refreshTokenHash,
        expiresAt,
        deviceName: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress: deviceInfo.ip,
        country: deviceInfo.country, // Mocked for now, implies GeoIP
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
    };
  }
}

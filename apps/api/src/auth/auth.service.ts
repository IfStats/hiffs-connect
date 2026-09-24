import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { SignupDto } from './dto/signup.dto.js';

import { PrismaService } from '../prisma.service.js';
import { VerifyCredentialsDto } from './dto/verify-credentials.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async verifyCredentials(dto: VerifyCredentialsDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },

      include: {
        memberships: {
          where: {
  active: true,

  business: {
    status: 'ACTIVE',
  },
},

          include: {
            business: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
  throw new UnauthorizedException('Account access is unavailable');
}

    const valid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.memberships.length === 0 && !user.platformRole) {
      throw new UnauthorizedException('User has no active workspace');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      platformRole: user.platformRole,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      platformRole: user.platformRole,

      memberships: user.memberships.map((membership) => ({
        id: membership.id,
        businessId: membership.businessId,
        businessName: membership.business.name,
        role: membership.role,
      })),

      accessToken,
    };
  }

  async signup(dto: SignupDto) {
  const email = dto.email.trim().toLowerCase();
  const countryCode = dto.countryCode.trim().toUpperCase();
  const businessName = dto.businessName.trim();

  const existingUser = await this.prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new ConflictException(
      'An account already exists with this email',
    );
  }

  const passwordHash = await bcrypt.hash(dto.password, 12);

  const result = await this.prisma.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: dto.name.trim(),
          passwordHash,
        },
      });

      const business = await tx.business.create({
        data: {
          name: businessName,
          countryCode,
          website: dto.website?.trim() || null,
          email:
            dto.businessEmail?.trim().toLowerCase() ||
            email,
          phone: dto.phone?.trim() || null,
        },
      });

      const wallet = await tx.wallet.create({
        data: {
          businessId: business.id,
          currency: 'USD',
          balance: new Prisma.Decimal(0),
        },
      });

      const membership =
        await tx.businessMembership.create({
          data: {
            userId: user.id,
            businessId: business.id,
            role: 'OWNER',
            active: true,
          },
        });

      return {
        user,
        business,
        wallet,
        membership,
      };
    },
    {
      maxWait: 10000,
      timeout: 20000,
    },
  );

  const accessToken = await this.jwtService.signAsync({
    sub: result.user.id,
    email: result.user.email,
    platformRole: result.user.platformRole,
  });

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      status: result.user.status,
      platformRole: result.user.platformRole,
      emailVerified: result.user.emailVerified,
    },

    business: {
      id: result.business.id,
      name: result.business.name,
      countryCode: result.business.countryCode,
      status: result.business.status,
    },

    membership: {
      id: result.membership.id,
      businessId: result.membership.businessId,
      role: result.membership.role,
      active: result.membership.active,
    },

    wallet: {
      id: result.wallet.id,
      currency: result.wallet.currency,
      balance: result.wallet.balance,
    },

    accessToken,
  };
}
}
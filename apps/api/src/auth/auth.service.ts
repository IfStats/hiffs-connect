import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma.service.js';
import { VerifyCredentialsDto } from './dto/verify-credentials.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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

    const valid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.memberships.length === 0 && !user.platformRole) {
      throw new UnauthorizedException('User has no active workspace');
    }

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
    };
  }
}

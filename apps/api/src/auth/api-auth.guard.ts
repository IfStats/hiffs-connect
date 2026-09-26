import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import type { PlatformRole } from '@prisma/client';
import type { Request } from 'express';

import { PrismaService } from '../prisma.service.js';
import type { AuthUser } from './auth-user.type.js';

type AccessTokenPayload = {
  sub: string;
  email: string;
  platformRole: PlatformRole | null;
};

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

@Injectable()
export class ApiAuthGuard
  implements CanActivate
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const authorization =
      request.headers.authorization;

    if (
      !authorization?.startsWith(
        'Bearer ',
      )
    ) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    const token =
      authorization
        .slice(7)
        .trim();

    if (!token) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(
          token,
        );

      const user =
        await this.prisma.user.findUnique({
          where: {
            id: payload.sub,
          },

          select: {
            id: true,
            email: true,
            platformRole: true,
            status: true,
            emailVerified: true,
          },
        });

      if (
        !user ||
        user.status !== 'ACTIVE' ||
        !user.emailVerified
      ) {
        throw new UnauthorizedException(
          'Account access is unavailable',
        );
      }

      request.user = {
        id: user.id,
        email: user.email,
        platformRole:
          user.platformRole,
      };

      return true;
    } catch (
      error
    ) {
      if (
        error instanceof
        UnauthorizedException
      ) {
        throw error;
      }

      throw new UnauthorizedException(
        'Invalid or expired access token',
      );
    }
  }
}
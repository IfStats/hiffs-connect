import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PlatformRole } from '@prisma/client';
import type { Request } from 'express';

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
export class ApiAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(token);

      request.user = {
        id: payload.sub,
        email: payload.email,
        platformRole: payload.platformRole,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}

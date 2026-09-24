import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@prisma/client';

import { Permission } from './permission.enum.js';
import { PERMISSIONS_KEY } from './require-permissions.decorator.js';
import { platformRoleHasPermission } from './role-permissions.js';

type AuthenticatedRequest = {
  user?: {
    id?: string;
    platformRole?: PlatformRole | null;
  };
};

@Injectable()
export class PlatformPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!user.platformRole) {
      throw new ForbiddenException('Platform access required');
    }

    const allowed = requiredPermissions.every((permission) =>
      platformRoleHasPermission(user.platformRole!, permission),
    );

    if (!allowed) {
      throw new ForbiddenException(
        'Insufficient platform permissions',
      );
    }

    return true;
  }
}
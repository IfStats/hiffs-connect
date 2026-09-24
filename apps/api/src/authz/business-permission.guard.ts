import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { PrismaService } from '../prisma.service.js';
import type { AuthUser } from '../auth/auth-user.type.js';
import { Permission } from './permission.enum.js';
import { PERMISSIONS_KEY } from './require-permissions.decorator.js';
import { businessRoleHasPermission } from './role-permissions.js';

type BusinessRequest = Request & {
  user?: AuthUser;
  businessMembership?: {
    id: string;
    businessId: string;
    role: string;
  };
};

@Injectable()
export class BusinessPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<BusinessRequest>();

    if (!request.user) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    const requiredPermissions =
      this.reflector.getAllAndOverride<Permission[]>(
        PERMISSIONS_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      ) ?? [];

    const rawBusinessId =
  request.params.businessId ??
  request.params.id;

const businessId =
  Array.isArray(rawBusinessId)
    ? rawBusinessId[0]
    : rawBusinessId;

    if (!businessId) {
      throw new ForbiddenException(
        'Business context required',
      );
    }

    const business =
      await this.prisma.business.findUnique({
        where: {
          id: businessId,
        },

        select: {
          id: true,
          status: true,
        },
      });

    if (!business) {
      throw new NotFoundException(
        'Business not found',
      );
    }

    if (business.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Business account is not active',
      );
    }

    const membership =
      await this.prisma.businessMembership.findUnique({
        where: {
          userId_businessId: {
            userId: request.user.id,
            businessId,
          },
        },

        select: {
          id: true,
          businessId: true,
          role: true,
          active: true,
        },
      });

    if (!membership?.active) {
      throw new ForbiddenException(
        'Active business membership required',
      );
    }

    const allowed = requiredPermissions.every(
      (permission) =>
        businessRoleHasPermission(
          membership.role,
          permission,
        ),
    );

    if (!allowed) {
      throw new ForbiddenException(
        'Insufficient business permissions',
      );
    }

    request.businessMembership = {
      id: membership.id,
      businessId: membership.businessId,
      role: membership.role,
    };

    return true;
  }
}
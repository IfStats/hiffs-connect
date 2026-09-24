import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BusinessRole } from '@prisma/client';

import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto.js';

import { PrismaService } from '../prisma.service.js';
import { UpdateBusinessAccountDto } from './dto/update-business-account.dto.js';
import { randomBytes, createHash } from 'node:crypto';
import { CreateBusinessInvitationDto } from './dto/create-business-invitation.dto.js';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccount(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: {
        id: businessId,
      },

      select: {
        id: true,
        name: true,
        countryCode: true,
        email: true,
        phone: true,
        website: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        wallet: {
          select: {
            id: true,
            currency: true,
            balance: true,
          },
        },

        _count: {
          select: {
            memberships: true,
            messages: true,
            senderIdentities: true,
            apiKeys: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  async updateAccount(businessId: string, dto: UpdateBusinessAccountDto) {
    const business = await this.prisma.business.findUnique({
      where: {
        id: businessId,
      },

      select: {
        id: true,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return this.prisma.business.update({
      where: {
        id: businessId,
      },

      data: {
        name: dto.name?.trim(),

        email: dto.email?.trim().toLowerCase(),

        phone: dto.phone?.trim(),

        website: dto.website?.trim(),
      },

      select: {
        id: true,
        name: true,
        countryCode: true,
        email: true,
        phone: true,
        website: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async getMembers(businessId: string) {
    return this.prisma.businessMembership.findMany({
      where: {
        businessId,
      },

      orderBy: {
        createdAt: 'asc',
      },

      select: {
        id: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,

        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
          },
        },
      },
    });
  }

  async updateMemberRole(
    businessId: string,
    membershipId: string,
    actorUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const actorMembership = await this.prisma.businessMembership.findUnique({
      where: {
        userId_businessId: {
          userId: actorUserId,
          businessId,
        },
      },
    });

    if (!actorMembership?.active) {
      throw new ForbiddenException('Active business membership required');
    }

    const targetMembership = await this.prisma.businessMembership.findFirst({
      where: {
        id: membershipId,
        businessId,
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundException('Business member not found');
    }

    if (
      actorMembership.role === BusinessRole.ADMIN &&
      targetMembership.role === BusinessRole.OWNER
    ) {
      throw new ForbiddenException('ADMIN cannot modify an OWNER');
    }

    if (dto.role === BusinessRole.OWNER) {
      throw new BadRequestException(
        'OWNER assignment requires an ownership transfer',
      );
    }

    if (targetMembership.role === BusinessRole.OWNER) {
      throw new BadRequestException(
        'OWNER role cannot be changed through member role management',
      );
    }

    return this.prisma.businessMembership.update({
      where: {
        id: membershipId,
      },

      data: {
        role: dto.role,
      },

      select: {
        id: true,
        businessId: true,
        role: true,
        active: true,
        updatedAt: true,

        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
          },
        },
      },
    });
  }

  async updateMemberStatus(
    businessId: string,
    membershipId: string,
    actorUserId: string,
    dto: UpdateMemberStatusDto,
  ) {
    const actorMembership = await this.prisma.businessMembership.findUnique({
      where: {
        userId_businessId: {
          userId: actorUserId,
          businessId,
        },
      },
    });

    if (!actorMembership?.active) {
      throw new ForbiddenException('Active business membership required');
    }

    const targetMembership = await this.prisma.businessMembership.findFirst({
      where: {
        id: membershipId,
        businessId,
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundException('Business member not found');
    }

    if (
      actorMembership.role === BusinessRole.ADMIN &&
      targetMembership.role === BusinessRole.OWNER
    ) {
      throw new ForbiddenException('ADMIN cannot modify an OWNER');
    }

    if (targetMembership.userId === actorUserId && dto.active === false) {
      throw new BadRequestException(
        'You cannot deactivate your own membership',
      );
    }

    if (targetMembership.role === BusinessRole.OWNER && dto.active === false) {
      const activeOwners = await this.prisma.businessMembership.count({
        where: {
          businessId,
          role: BusinessRole.OWNER,
          active: true,
        },
      });

      if (activeOwners <= 1) {
        throw new BadRequestException(
          'Cannot deactivate the last active OWNER',
        );
      }
    }

    return this.prisma.businessMembership.update({
      where: {
        id: membershipId,
      },

      data: {
        active: dto.active,
      },

      select: {
        id: true,
        businessId: true,
        role: true,
        active: true,
        updatedAt: true,

        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
          },
        },
      },
    });
  }

  async createInvitation(
    businessId: string,
    actorUserId: string,
    dto: CreateBusinessInvitationDto,
  ) {
    const email = dto.email.trim().toLowerCase();

    if (dto.role === BusinessRole.OWNER) {
      throw new BadRequestException(
        'OWNER cannot be assigned through an invitation',
      );
    }

    const actorMembership = await this.prisma.businessMembership.findUnique({
      where: {
        userId_businessId: {
          userId: actorUserId,
          businessId,
        },
      },

      select: {
        id: true,
        role: true,
        active: true,
      },
    });

    if (!actorMembership?.active) {
      throw new ForbiddenException('Active business membership required');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id: true,
      },
    });

    if (existingUser) {
      const existingMembership =
        await this.prisma.businessMembership.findUnique({
          where: {
            userId_businessId: {
              userId: existingUser.id,
              businessId,
            },
          },
        });

      if (existingMembership) {
        throw new BadRequestException(
          'User is already a member of this business',
        );
      }
    }

    const existingInvite = await this.prisma.businessInvitation.findFirst({
      where: {
        businessId,
        email,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvite) {
      throw new BadRequestException(
        'An active invitation already exists for this email',
      );
    }

    const rawToken = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.businessInvitation.create({
      data: {
        businessId,
        email,
        role: dto.role,
        tokenHash,
        invitedByUserId: actorUserId,
        expiresAt,
      },

      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,

        business: {
          select: {
            id: true,
            name: true,
          },
        },

        invitedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return {
      invitation,

      inviteToken: rawToken,
    };
  }

  async getInvitations(businessId: string) {
    return this.prisma.businessInvitation.findMany({
      where: {
        businessId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        createdAt: true,

        invitedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },

        acceptedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async revokeInvitation(businessId: string, invitationId: string) {
    const invitation = await this.prisma.businessInvitation.findFirst({
      where: {
        id: invitationId,
        businessId,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    return this.prisma.businessInvitation.update({
      where: {
        id: invitation.id,
      },

      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },

      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        revokedAt: true,
        updatedAt: true,
      },
    });
  }

  async resendInvitation(businessId: string, invitationId: string) {
    const invitation = await this.prisma.businessInvitation.findFirst({
      where: {
        id: invitationId,
        businessId,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Only pending invitations can be resent');
    }

    const rawToken = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updatedInvitation = await this.prisma.businessInvitation.update({
      where: {
        id: invitation.id,
      },

      data: {
        tokenHash,
        expiresAt,
        revokedAt: null,
      },

      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        updatedAt: true,
      },
    });

    return {
      invitation: updatedInvitation,

      inviteToken: rawToken,
    };
  }
}

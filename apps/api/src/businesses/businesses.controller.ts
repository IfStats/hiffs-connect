import {
  Body,
  Controller,
  Get,
  Param,
  Req,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';
import type { AuthUser } from '../auth/auth-user.type.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto.js';

import { ApiAuthGuard } from '../auth/api-auth.guard.js';
import { BusinessPermissionGuard } from '../authz/business-permission.guard.js';
import { Permission } from '../authz/permission.enum.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';

import { BusinessesService } from './businesses.service.js';
import { UpdateBusinessAccountDto } from './dto/update-business-account.dto.js';
import { CreateBusinessInvitationDto } from './dto/create-business-invitation.dto.js';

type AuthenticatedRequest = Request & {
  user: AuthUser;
};

@Controller('businesses')
@UseGuards(
  ApiAuthGuard,
  BusinessPermissionGuard,
)
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
  ) {}

  @Get(':businessId/account')
  @RequirePermissions(
    Permission.BUSINESS_READ,
  )
  getAccount(
    @Param('businessId')
    businessId: string,
  ) {
    return this.businessesService.getAccount(
      businessId,
    );
  }

  @Patch(':businessId/account')
  @RequirePermissions(
    Permission.BUSINESS_UPDATE,
  )
  updateAccount(
    @Param('businessId')
    businessId: string,

    @Body()
    dto: UpdateBusinessAccountDto,
  ) {
    return this.businessesService.updateAccount(
      businessId,
      dto,
    );
  }

  @Get(':businessId/members')
  @RequirePermissions(
    Permission.MEMBER_READ,
  )
  getMembers(
    @Param('businessId')
    businessId: string,
  ) {
    return this.businessesService.getMembers(
      businessId,
    );
  }

  @Patch(':businessId/members/:membershipId/role')
@RequirePermissions(
  Permission.MEMBER_UPDATE_ROLE,
)
updateMemberRole(
  @Param('businessId')
  businessId: string,

  @Param('membershipId')
  membershipId: string,

  @Body()
  dto: UpdateMemberRoleDto,

  @Req()
  request: AuthenticatedRequest,
) {
  return this.businessesService.updateMemberRole(
    businessId,
    membershipId,
    request.user.id,
    dto,
  );
}

@Patch(':businessId/members/:membershipId/status')
@RequirePermissions(
  Permission.MEMBER_REMOVE,
)
updateMemberStatus(
  @Param('businessId')
  businessId: string,

  @Param('membershipId')
  membershipId: string,

  @Body()
  dto: UpdateMemberStatusDto,

  @Req()
  request: AuthenticatedRequest,
) {
  return this.businessesService.updateMemberStatus(
    businessId,
    membershipId,
    request.user.id,
    dto,
  );
}
@Post(':businessId/invitations')
@RequirePermissions(
  Permission.MEMBER_INVITE,
)
createInvitation(
  @Param('businessId')
  businessId: string,

  @Body()
  dto: CreateBusinessInvitationDto,

  @Req()
  request: AuthenticatedRequest,
) {
  return this.businessesService.createInvitation(
    businessId,
    request.user.id,
    dto,
  );
}

@Get(':businessId/invitations')
@RequirePermissions(
  Permission.MEMBER_READ,
)
getInvitations(
  @Param('businessId')
  businessId: string,
) {
  return this.businessesService.getInvitations(
    businessId,
  );
}

@Post(
  ':businessId/invitations/:invitationId/revoke',
)
@RequirePermissions(
  Permission.MEMBER_INVITE,
)
revokeInvitation(
  @Param('businessId')
  businessId: string,

  @Param('invitationId')
  invitationId: string,
) {
  return this.businessesService.revokeInvitation(
    businessId,
    invitationId,
  );
}

@Post(
  ':businessId/invitations/:invitationId/resend',
)
@RequirePermissions(
  Permission.MEMBER_INVITE,
)
resendInvitation(
  @Param('businessId')
  businessId: string,

  @Param('invitationId')
  invitationId: string,
) {
  return this.businessesService.resendInvitation(
    businessId,
    invitationId,
  );
}
}
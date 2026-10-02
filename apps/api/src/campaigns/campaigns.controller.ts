import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiAuthGuard,
} from '../auth/api-auth.guard.js';

import {
  BusinessPermissionGuard,
} from '../authz/business-permission.guard.js';

import {
  Permission,
} from '../authz/permission.enum.js';

import {
  RequirePermissions,
} from '../authz/require-permissions.decorator.js';

import {
  CampaignsService,
} from './campaigns.service.js';

import {
  CreateCampaignDto,
} from './dto/create-campaign.dto.js';

@Controller('campaigns')
@UseGuards(
  ApiAuthGuard,
  BusinessPermissionGuard,
)
export class CampaignsController {
  constructor(
    private readonly campaignsService:
      CampaignsService,
  ) {}

  @Post('business/:businessId')
  @RequirePermissions(
    Permission.MESSAGE_SEND_BULK,
  )
  create(
    @Param('businessId')
    businessId: string,

    @Body()
    dto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(
      businessId,
      dto,
    );
  }

  @Get('business/:businessId')
  @RequirePermissions(
    Permission.MESSAGE_READ,
  )
  findByBusiness(
    @Param('businessId')
    businessId: string,
  ) {
    return this.campaignsService.findByBusiness(
      businessId,
    );
  }

  @Get('business/:businessId/:id')
  @RequirePermissions(
    Permission.MESSAGE_READ,
  )
  findOneForBusiness(
    @Param('businessId')
    businessId: string,

    @Param('id')
    id: string,
  ) {
    return this.campaignsService.findOneForBusiness(
      businessId,
      id,
    );
  }
}
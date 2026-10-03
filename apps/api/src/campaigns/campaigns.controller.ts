import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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

import {
  CampaignRecipientsQueryDto,
} from './dto/campaign-recipients-query.dto.js';

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

  @Get(
  'business/:businessId/:id/recipients',
)
@RequirePermissions(
  Permission.MESSAGE_READ,
)
findRecipients(
  @Param('businessId')
  businessId: string,

  @Param('id')
  id: string,

  @Query()
  query:
    CampaignRecipientsQueryDto,
) {
  return this.campaignsService.findRecipients(
    businessId,
    id,
    query.page,
    query.limit,
  );
}

@Post(
  'business/:businessId/:id/launch',
)
@RequirePermissions(
  Permission.MESSAGE_SEND_BULK,
)
launch(
  @Param('businessId')
  businessId: string,

  @Param('id')
  id: string,
) {
  return this.campaignsService.launch(
    businessId,
    id,
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
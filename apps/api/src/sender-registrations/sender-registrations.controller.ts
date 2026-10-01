import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ApiAuthGuard } from '../auth/api-auth.guard.js';
import { BusinessPermissionGuard } from '../authz/business-permission.guard.js';
import { PlatformPermissionGuard } from '../authz/platform-permission.guard.js';
import { Permission } from '../authz/permission.enum.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';

import { CreateSenderRegistrationDto } from './dto/create-sender-registration.dto.js';
import { UpdateSenderStatusDto } from './dto/update-sender-status.dto.js';
import { SenderRegistrationsService } from './sender-registrations.service.js';
import { SenderRequirementsService } from './sender-requirements.service.js';
import {
  CreateSenderDocumentDto,
} from './dto/create-sender-document.dto.js';

import {
  UpdateSenderValidationStatusDto,
} from './dto/update-sender-validation-status.dto.js';

import {
  UpdateSenderDocumentStatusDto,
} from './dto/update-sender-document-status.dto.js';

@Controller('sender-registrations')
export class SenderRegistrationsController {
  constructor(
    private readonly senderRegistrationsService: SenderRegistrationsService,
    private readonly senderRequirementsService: SenderRequirementsService,
  ) {}

  @Post('business/:businessId')
  @UseGuards(
    ApiAuthGuard,
    BusinessPermissionGuard,
  )
  @RequirePermissions(
    Permission.SENDER_MANAGE,
  )
  create(
    @Param('businessId')
    businessId: string,

    @Body()
    dto: CreateSenderRegistrationDto,
  ) {
    return this.senderRegistrationsService.create(
      businessId,
      dto,
    );
  }

  @Get('business/:businessId')
  @UseGuards(
    ApiAuthGuard,
    BusinessPermissionGuard,
  )
  @RequirePermissions(
    Permission.SENDER_READ,
  )
  findByBusiness(
    @Param('businessId')
    businessId: string,
  ) {
    return this.senderRegistrationsService.findByBusiness(
      businessId,
    );
  }

  @Get('business/:businessId/:id')
  @UseGuards(
    ApiAuthGuard,
    BusinessPermissionGuard,
  )
  @RequirePermissions(
    Permission.SENDER_READ,
  )
  findOneForBusiness(
    @Param('businessId')
    businessId: string,

    @Param('id')
    id: string,
  ) {
    return this.senderRegistrationsService.findOneForBusiness(
      businessId,
      id,
    );
  }

  @Patch(
  'business/:businessId/:id/submit',
)
@UseGuards(
  ApiAuthGuard,
  BusinessPermissionGuard,
)
@RequirePermissions(
  Permission.SENDER_MANAGE,
)
submitForReview(
  @Param('businessId')
  businessId: string,

  @Param('id')
  id: string,
) {
  return this.senderRegistrationsService.submitForReview(
    businessId,
    id,
  );
}

@Get('requirements')
@UseGuards(ApiAuthGuard)
getRequirements(
  @Query('provider')
  provider?: string,

  @Query('countryCode')
  countryCode?: string,

  @Query('channel')
  channel?: 'SMS' | 'WHATSAPP',

  @Query('senderType')
  senderType?: 'SHARED' | 'DEDICATED',
) {
  return this.senderRequirementsService.findAll({
    provider,
    countryCode,
    channel,
    senderType,
  });
}

@Patch(':id/validation-status')
@UseGuards(
  ApiAuthGuard,
  PlatformPermissionGuard,
)
@RequirePermissions(
  Permission.SENDER_APPROVE,
)
updateValidationStatus(
  @Param('id')
  id: string,

  @Body()
  dto: UpdateSenderValidationStatusDto,
) {
  return this.senderRegistrationsService.updateValidationStatus(
    id,
    dto,
  );
}

@Post(':id/documents')
@UseGuards(
  ApiAuthGuard,
  PlatformPermissionGuard,
)
@RequirePermissions(
  Permission.SENDER_APPROVE,
)
addDocument(
  @Param('id')
  id: string,

  @Body()
  dto: CreateSenderDocumentDto,
) {
  return this.senderRegistrationsService.addDocument(
    id,
    dto,
  );
}

@Patch(':id/documents/:documentId/status')
@UseGuards(
  ApiAuthGuard,
  PlatformPermissionGuard,
)
@RequirePermissions(
  Permission.SENDER_APPROVE,
)
updateDocumentStatus(
  @Param('id')
  id: string,

  @Param('documentId')
  documentId: string,

  @Body()
  dto: UpdateSenderDocumentStatusDto,
) {
  return this.senderRegistrationsService.updateDocumentStatus(
    id,
    documentId,
    dto,
  );
}

@Get(':id')
@UseGuards(
  ApiAuthGuard,
  PlatformPermissionGuard,
)
@RequirePermissions(
  Permission.SENDER_READ,
)
findOne(
  @Param('id')
  id: string,
) {
  return this.senderRegistrationsService.findOne(
    id,
  );
}

  @Patch(':id/status')
  @UseGuards(
    ApiAuthGuard,
    PlatformPermissionGuard,
  )
  @RequirePermissions(
    Permission.SENDER_APPROVE,
  )
  updateStatus(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateSenderStatusDto,
  ) {
    return this.senderRegistrationsService.updateStatus(
      id,
      dto,
    );
  }
}
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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

@Controller('sender-registrations')
export class SenderRegistrationsController {
  constructor(
    private readonly senderRegistrationsService: SenderRegistrationsService,
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
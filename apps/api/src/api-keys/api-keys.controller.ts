import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApiAuthGuard } from '../auth/api-auth.guard.js';
import { BusinessPermissionGuard } from '../authz/business-permission.guard.js';
import { Permission } from '../authz/permission.enum.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';

import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';

@Controller('api-keys')
@UseGuards(
  ApiAuthGuard,
  BusinessPermissionGuard,
)
export class ApiKeysController {
  constructor(
    private readonly apiKeysService: ApiKeysService,
  ) {}

  @Post('business/:businessId')
  @RequirePermissions(
    Permission.API_KEY_CREATE,
  )
  create(
    @Param('businessId')
    businessId: string,

    @Body()
    dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.create(
      businessId,
      dto,
    );
  }

  @Get('business/:businessId')
  @RequirePermissions(
    Permission.API_KEY_READ,
  )
  findByBusiness(
    @Param('businessId')
    businessId: string,
  ) {
    return this.apiKeysService.findByBusiness(
      businessId,
    );
  }

  @Delete(
    'business/:businessId/:id',
  )
  @RequirePermissions(
    Permission.API_KEY_REVOKE,
  )
  revoke(
    @Param('businessId')
    businessId: string,

    @Param('id')
    id: string,
  ) {
    return this.apiKeysService.revoke(
      businessId,
      id,
    );
  }
}
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApiAuthGuard } from '../auth/api-auth.guard.js';
import { PlatformPermissionGuard } from '../authz/platform-permission.guard.js';
import { Permission } from '../authz/permission.enum.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';

import { CreatePricingDto } from './dto/create-pricing.dto.js';
import {
  CreateSenderRegistrationPricingDto,
} from './dto/create-sender-registration-pricing.dto.js';
import { PricingService } from './pricing.service.js';

@Controller('pricing')
@UseGuards(
  ApiAuthGuard,
  PlatformPermissionGuard,
)
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
  ) {}

  @Post()
  @RequirePermissions(
    Permission.PRICING_MANAGE,
  )
  create(
    @Body()
    dto: CreatePricingDto,
  ) {
    return this.pricingService.create(dto);
  }

  @Get()
  @RequirePermissions(
    Permission.PRICING_READ,
  )
  findAll() {
    return this.pricingService.findAll();
  }

  @Post('sender-registrations')
@RequirePermissions(
  Permission.PRICING_MANAGE,
)
createSenderRegistrationPricing(
  @Body()
  dto: CreateSenderRegistrationPricingDto,
) {
  return this.pricingService.createSenderRegistrationPricing(
    dto,
  );
}

@Get('sender-registrations')
@RequirePermissions(
  Permission.PRICING_READ,
)
findSenderRegistrationPricing() {
  return this.pricingService.findSenderRegistrationPricing();
}

  @Get(':id')
  @RequirePermissions(
    Permission.PRICING_READ,
  )
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.pricingService.findOne(id);
  }
}
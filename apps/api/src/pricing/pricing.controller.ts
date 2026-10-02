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
import { PlatformPermissionGuard } from '../authz/platform-permission.guard.js';
import { Permission } from '../authz/permission.enum.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';

import { CreatePricingDto } from './dto/create-pricing.dto.js';
import {
  CreateSenderRegistrationPricingDto,
} from './dto/create-sender-registration-pricing.dto.js';
import { PricingService } from './pricing.service.js';
import {
  ReplaceSenderRegistrationPricingDto,
} from './dto/replace-sender-registration-pricing.dto.js';

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

@Patch(
  'sender-registrations/:id/deactivate',
)
@RequirePermissions(
  Permission.PRICING_MANAGE,
)
deactivateSenderRegistrationPricing(
  @Param('id')
  id: string,
) {
  return this.pricingService.deactivateSenderRegistrationPricing(
    id,
  );
}

@Patch(
  'sender-registrations/:id/replace',
)
@RequirePermissions(
  Permission.PRICING_MANAGE,
)
replaceSenderRegistrationPricing(
  @Param('id')
  id: string,

  @Body()
  dto: ReplaceSenderRegistrationPricingDto,
) {
  return this.pricingService.replaceSenderRegistrationPricing(
    id,
    dto,
  );
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
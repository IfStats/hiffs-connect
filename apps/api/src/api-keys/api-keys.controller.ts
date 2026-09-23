import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('business/:businessId')
  create(
    @Param('businessId')
    businessId: string,

    @Body()
    dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.create(businessId, dto);
  }

  @Get('business/:businessId')
  findByBusiness(
    @Param('businessId')
    businessId: string,
  ) {
    return this.apiKeysService.findByBusiness(businessId);
  }

  @Delete(':id')
  revoke(
    @Param('id')
    id: string,
  ) {
    return this.apiKeysService.revoke(id);
  }
}

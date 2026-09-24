import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PricingService } from './pricing.service.js';
import { CreatePricingDto } from './dto/create-pricing.dto.js';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post()
  create(@Body() dto: CreatePricingDto) {
    return this.pricingService.create(dto);
  }

  @Get()
  findAll() {
    return this.pricingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pricingService.findOne(id);
  }
}

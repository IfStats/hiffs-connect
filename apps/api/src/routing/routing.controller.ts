import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RoutingService } from './routing.service.js';
import { CreateRoutingRuleDto } from './dto/create-routing-rule.dto.js';
import { UpdateRoutingRuleDto } from './dto/update-routing-rule.dto.js';

@Controller('routing')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post()
  create(@Body() dto: CreateRoutingRuleDto) {
    return this.routingService.create(dto);
  }

  @Get()
  findAll() {
    return this.routingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routingService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoutingRuleDto) {
    return this.routingService.update(id, dto);
  }
}

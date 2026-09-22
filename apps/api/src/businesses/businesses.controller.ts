import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BusinessesService } from './businesses.service.js';
import { CreateBusinessDto } from './dto/create-business.dto.js';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  create(@Body() dto: CreateBusinessDto) {
    return this.businessesService.create(dto);
  }

  @Get()
  findAll() {
    return this.businessesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(id);
  }
}
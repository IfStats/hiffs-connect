import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SenderRegistrationsService } from './sender-registrations.service.js';
import { CreateSenderRegistrationDto } from './dto/create-sender-registration.dto.js';
import { UpdateSenderStatusDto } from './dto/update-sender-status.dto.js';

@Controller('sender-registrations')
export class SenderRegistrationsController {
  constructor(
    private readonly senderRegistrationsService: SenderRegistrationsService,
  ) {}

  @Post()
  create(@Body() dto: CreateSenderRegistrationDto) {
    return this.senderRegistrationsService.create(dto);
  }

  @Get()
  findAll() {
    return this.senderRegistrationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.senderRegistrationsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSenderStatusDto) {
    return this.senderRegistrationsService.updateStatus(id, dto);
  }
}

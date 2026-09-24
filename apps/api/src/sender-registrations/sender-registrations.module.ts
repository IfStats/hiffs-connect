import { Module } from '@nestjs/common';
import { SenderRegistrationsController } from './sender-registrations.controller.js';
import { SenderRegistrationsService } from './sender-registrations.service.js';

@Module({
  controllers: [SenderRegistrationsController],
  providers: [SenderRegistrationsService],
  exports: [SenderRegistrationsService],
})
export class SenderRegistrationsModule {}

import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller.js';
import { MessagingService } from './messaging.service.js';
import { InfobipProvider } from './providers/infobip.provider.js';
import { RouteMobileProvider } from './providers/routemobile.provider.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';

@Module({
  imports: [ApiKeysModule],

  controllers: [MessagingController],

  providers: [MessagingService, InfobipProvider, RouteMobileProvider],

  exports: [MessagingService],
})
export class MessagingModule {}

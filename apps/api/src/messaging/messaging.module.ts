import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthModule } from '../auth/auth.module.js';

import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller.js';
import { MessagingService } from './messaging.service.js';
import { InfobipProvider } from './providers/infobip.provider.js';
import { RouteMobileProvider } from './providers/routemobile.provider.js';
import { InfobipWebhookGuard } from './infobip-webhook.guard.js';
import { RouteMobileWebhookGuard } from './routemobile-webhook.guard.js';


@Module({
  imports: [
  ApiKeysModule,
  AuthModule,
],

  controllers: [MessagingController],

  providers: [
  MessagingService,
  InfobipProvider,
  RouteMobileProvider,
  InfobipWebhookGuard,
  RouteMobileWebhookGuard,
],

  exports: [MessagingService],
})
export class MessagingModule {}

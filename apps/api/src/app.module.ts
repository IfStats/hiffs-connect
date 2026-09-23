import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MessagingModule } from './messaging/messaging.module.js';
import { PrismaModule } from './prisma.module.js';
import { BusinessesModule } from './businesses/businesses.module.js';
import { SenderRegistrationsModule } from './sender-registrations/sender-registrations.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { RoutingModule } from './routing/routing.module.js';
import { WalletsModule } from './wallets/wallets.module.js';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MessagingModule,
    BusinessesModule,
    SenderRegistrationsModule,
    PricingModule,
    RoutingModule,
    WalletsModule,
    ApiKeysModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { AuthzModule } from '../authz/authz.module.js';
import { PrismaModule } from '../prisma.module.js';

import { PricingController } from './pricing.controller.js';
import { PricingService } from './pricing.service.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuthzModule,
  ],

  controllers: [
    PricingController,
  ],

  providers: [
    PricingService,
  ],

  exports: [
    PricingService,
  ],
})
export class PricingModule {}
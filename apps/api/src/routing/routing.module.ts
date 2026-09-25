import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { AuthzModule } from '../authz/authz.module.js';
import { PrismaModule } from '../prisma.module.js';

import { RoutingController } from './routing.controller.js';
import { RoutingService } from './routing.service.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuthzModule,
  ],

  controllers: [
    RoutingController,
  ],

  providers: [
    RoutingService,
  ],

  exports: [
    RoutingService,
  ],
})
export class RoutingModule {}
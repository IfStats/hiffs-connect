import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { AuthzModule } from '../authz/authz.module.js';
import { PrismaModule } from '../prisma.module.js';

import { SenderRegistrationsController } from './sender-registrations.controller.js';
import { SenderRegistrationsService } from './sender-registrations.service.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuthzModule,
  ],

  controllers: [
    SenderRegistrationsController,
  ],

  providers: [
    SenderRegistrationsService,
  ],

  exports: [
    SenderRegistrationsService,
  ],
})
export class SenderRegistrationsModule {}
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { AuthzModule } from '../authz/authz.module.js';
import { PrismaModule } from '../prisma.module.js';

import { WalletsController } from './wallets.controller.js';
import { WalletsService } from './wallets.service.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuthzModule,
  ],

  controllers: [
    WalletsController,
  ],

  providers: [
    WalletsService,
  ],

  exports: [
    WalletsService,
  ],
})
export class WalletsModule {}
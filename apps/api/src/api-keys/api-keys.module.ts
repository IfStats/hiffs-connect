import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { AuthzModule } from '../authz/authz.module.js';
import { PrismaModule } from '../prisma.module.js';

import { ApiKeyGuard } from './api-key.guard.js';
import { ApiKeysController } from './api-keys.controller.js';
import { ApiKeysService } from './api-keys.service.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuthzModule,
  ],

  controllers: [
    ApiKeysController,
  ],

  providers: [
    ApiKeysService,
    ApiKeyGuard,
  ],

  exports: [
    ApiKeysService,
    ApiKeyGuard,
  ],
})
export class ApiKeysModule {}
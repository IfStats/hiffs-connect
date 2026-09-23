import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma.module.js';
import { ApiKeyGuard } from './api-key.guard.js';
import { ApiKeysController } from './api-keys.controller.js';
import { ApiKeysService } from './api-keys.service.js';

@Module({
  imports: [PrismaModule],

  controllers: [ApiKeysController],

  providers: [ApiKeysService, ApiKeyGuard],

  exports: [ApiKeysService, ApiKeyGuard],
})
export class ApiKeysModule {}

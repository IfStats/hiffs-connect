import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { AuthzModule } from '../authz/authz.module.js';
import { PrismaModule } from '../prisma.module.js';

import { BusinessesController } from './businesses.controller.js';
import { BusinessesService } from './businesses.service.js';

@Module({
  imports: [PrismaModule, AuthModule, AuthzModule],

  controllers: [BusinessesController],

  providers: [BusinessesService],

  exports: [BusinessesService],
})
export class BusinessesModule {}

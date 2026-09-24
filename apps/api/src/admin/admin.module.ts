import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { AuthzModule } from '../authz/authz.module.js';
import { PrismaModule } from '../prisma.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [PrismaModule, AuthModule, AuthzModule],

  controllers: [AdminController],

  providers: [AdminService],
})
export class AdminModule {}

import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma.module.js';
import { BusinessPermissionGuard } from './business-permission.guard.js';
import { PlatformPermissionGuard } from './platform-permission.guard.js';

@Module({
  imports: [PrismaModule],

  providers: [PlatformPermissionGuard, BusinessPermissionGuard],

  exports: [PlatformPermissionGuard, BusinessPermissionGuard],
})
export class AuthzModule {}

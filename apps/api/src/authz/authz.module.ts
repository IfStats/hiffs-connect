import { Module } from '@nestjs/common';
import { PlatformPermissionGuard } from './platform-permission.guard.js';

@Module({
  providers: [PlatformPermissionGuard],
  exports: [PlatformPermissionGuard],
})
export class AuthzModule {}
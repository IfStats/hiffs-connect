import { SetMetadata } from '@nestjs/common';
import { Permission } from './permission.enum.js';

export const PERMISSIONS_KEY = 'required_permissions';

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
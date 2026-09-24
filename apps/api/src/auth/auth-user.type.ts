import type { PlatformRole } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string;
  platformRole: PlatformRole | null;
};
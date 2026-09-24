import { PlatformRole } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdatePlatformRoleDto {
  @IsOptional()
  @IsEnum(PlatformRole)
  platformRole!: PlatformRole | null;
}
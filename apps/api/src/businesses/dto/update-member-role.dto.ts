import { BusinessRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsEnum(BusinessRole)
  role!: BusinessRole;
}
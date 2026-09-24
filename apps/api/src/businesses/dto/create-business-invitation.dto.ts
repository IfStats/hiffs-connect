import { BusinessRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
} from 'class-validator';

export class CreateBusinessInvitationDto {
  @IsEmail()
  email!: string;

  @IsEnum(BusinessRole)
  role!: BusinessRole;
}
import { IsBoolean } from 'class-validator';

export class UpdateMemberStatusDto {
  @IsBoolean()
  active!: boolean;
}

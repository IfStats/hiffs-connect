import { IsString, Length } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  @Length(64, 64)
  token!: string;
}

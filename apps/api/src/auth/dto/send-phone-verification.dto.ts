import { IsEmail } from 'class-validator';

export class SendPhoneVerificationDto {
  @IsEmail()
  email!: string;
}
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'to must be a valid international phone number, e.g. +233XXXXXXXXX',
  })
  to!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1600)
  text!: string;

  @IsOptional()
  @IsString()
  sender?: string;

  @IsString()
  @IsNotEmpty()
  senderRegistrationId!: string;
}
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class SendBatchSmsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @Matches(/^\+[1-9]\d{7,14}$/, {
    each: true,
    message:
      'each recipient must be a valid international phone number, e.g. +233XXXXXXXXX',
  })
  recipients!: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(1600)
  text!: string;

  @IsString()
  @IsNotEmpty()
  senderRegistrationId!: string;
}
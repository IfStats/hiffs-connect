import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsString()
@IsNotEmpty()
@MaxLength(128)
clientRequestId!: string;

  @IsString()
  @IsNotEmpty()
  senderRegistrationId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1600)
  content!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({
    each: true,
  })
  @Matches(
    /^\+[1-9]\d{7,14}$/,
    {
      each: true,
      message:
        'each recipient must be a valid international phone number',
    },
  )
  recipients!: string[];

  @IsOptional()
  @IsString()
  scheduledAt?: string;
}
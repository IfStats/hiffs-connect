import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum MessageChannelDto {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export enum SenderTypeDto {
  SHARED = 'SHARED',
  DEDICATED = 'DEDICATED',
}

export class CreateSenderRegistrationDto {
  @IsString()
  @IsNotEmpty()
  businessId!: string;

  @IsEnum(MessageChannelDto)
  channel!: MessageChannelDto;

  @IsEnum(SenderTypeDto)
  senderType!: SenderTypeDto;

  @IsString()
  @IsNotEmpty()
  senderValue!: string;

  @IsString()
  @IsNotEmpty()
  countryCode!: string;

  @IsOptional()
  @IsString()
  destinationCountry?: string;

  @IsOptional()
  @IsString()
  useCase?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedMonthlyVolume?: number;
}

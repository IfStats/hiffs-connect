import {
  IsEnum,
  IsNumber,
  IsString,
  Length,
  Min,
} from 'class-validator';

export enum SenderPricingChannelDto {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export enum SenderPricingTypeDto {
  SHARED = 'SHARED',
  DEDICATED = 'DEDICATED',
}

export class CreateSenderRegistrationPricingDto {
  @IsString()
  provider!: string;

  @IsString()
  @Length(2, 2)
  countryCode!: string;

  @IsEnum(SenderPricingChannelDto)
  channel!: SenderPricingChannelDto;

  @IsEnum(SenderPricingTypeDto)
  senderType!: SenderPricingTypeDto;

  @IsNumber()
  @Min(0)
  providerCost!: number;

  @IsString()
  @Length(3, 3)
  providerCostCurrency!: string;

  @IsNumber()
  @Min(0)
  retailPrice!: number;

  @IsString()
  @Length(3, 3)
  currency!: string;
}
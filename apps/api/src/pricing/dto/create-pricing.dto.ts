import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export enum PricingChannelDto {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export class CreatePricingDto {
  @IsString()
  @Length(2, 2)
  countryCode!: string;

  @IsString()
  @IsNotEmpty()
  countryName!: string;

  @IsEnum(PricingChannelDto)
  channel!: PricingChannelDto;

  @IsOptional()
  @IsString()
  network?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsNumber()
  @Min(0)
  providerCost!: number;

  @IsNumber()
  @Min(0)
  retailPrice!: number;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minVolume?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxVolume?: number;
}
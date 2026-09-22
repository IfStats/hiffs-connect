import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export enum RoutingChannelDto {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export class CreateRoutingRuleDto {
  @IsString()
  @Length(2, 2)
  countryCode!: string;

  @IsEnum(RoutingChannelDto)
  channel!: RoutingChannelDto;

  @IsString()
  @IsNotEmpty()
  provider!: string;

  @IsOptional()
  @IsString()
  network?: string;

  @IsInt()
  @Min(1)
  priority!: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
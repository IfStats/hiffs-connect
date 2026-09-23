import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class InfobipStatusDto {
  @IsInt()
  id!: number;

  @IsInt()
  groupId!: number;

  @IsString()
  groupName!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;
}

class InfobipErrorDto {
  @IsInt()
  id!: number;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsInt()
  groupId!: number;

  @IsString()
  groupName!: string;

  @IsBoolean()
  permanent!: boolean;
}

class InfobipPriceDto {
  @IsNumber()
  pricePerMessage!: number;

  @IsString()
  currency!: string;
}

class InfobipDeliveryResultDto {
  @IsOptional()
  @IsString()
  bulkId?: string;

  @IsString()
  messageId!: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  sender?: string;

  @IsOptional()
  @IsString()
  sentAt?: string;

  @IsOptional()
  @IsString()
  doneAt?: string;

  @IsOptional()
  @IsInt()
  smsCount?: number;

  @IsOptional()
  @IsInt()
  messageCount?: number;

  @IsObject()
  @ValidateNested()
  @Type(() => InfobipStatusDto)
  status!: InfobipStatusDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => InfobipErrorDto)
  error?: InfobipErrorDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => InfobipPriceDto)
  price?: InfobipPriceDto;
}

export class InfobipDeliveryReportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InfobipDeliveryResultDto)
  results!: InfobipDeliveryResultDto[];
}

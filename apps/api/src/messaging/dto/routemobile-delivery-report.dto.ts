import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class RouteMobileDeliveryReportDto {
  @IsString()
  @IsNotEmpty()
  sMessageId!: string;

  @IsString()
  @IsNotEmpty()
  sStatus!: string;

  @IsOptional()
  @IsString()
  dtSubmit?: string;

  @IsOptional()
  @IsString()
  dtDone?: string;

  @IsOptional()
  @IsString()
  sErrCode?: string;

  @IsOptional()
  @IsString()
  sError?: string;

  @IsOptional()
  @IsString()
  sDestination?: string;

  @IsOptional()
  @IsString()
  iCostPerSms?: string;

  @IsOptional()
  @IsString()
  iCharge?: string;
}
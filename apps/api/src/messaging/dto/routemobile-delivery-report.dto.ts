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
  sSender?: string;

  @IsOptional()
  @IsString()
  sMobileNo?: string;

  @IsOptional()
  @IsString()
  dtSubmit?: string;

  @IsOptional()
  @IsString()
  dtDone?: string;

  @IsOptional()
  @IsString()
  iErrCode?: string;

  @IsOptional()
  @IsString()
  sError?: string;

  @IsOptional()
  @IsString()
  iCostPerSms?: string;

  @IsOptional()
  @IsString()
  iCharge?: string;

  @IsOptional()
  @IsString()
  iMCCMNC?: string;

  @IsOptional()
  @IsString()
  sTagName?: string;

  @IsOptional()
  @IsString()
  sUdf1?: string;

  @IsOptional()
  @IsString()
  sUdf2?: string;
}
import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class TopUpWalletDto {
  @IsNumber()
  @Min(0.000001)
  amount!: number;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
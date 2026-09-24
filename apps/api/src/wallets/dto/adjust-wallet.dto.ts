import { IsNumber, IsOptional, IsString, NotEquals } from 'class-validator';

export class AdjustWalletDto {
  @IsNumber()
  @NotEquals(0)
  amount!: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

import {
  IsNumber,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class ReplaceSenderRegistrationPricingDto {
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
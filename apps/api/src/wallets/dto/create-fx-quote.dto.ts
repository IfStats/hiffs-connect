import {
  IsString,
  Matches,
} from 'class-validator';

export class CreateFxQuoteDto {
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  toCurrency!: string;
}
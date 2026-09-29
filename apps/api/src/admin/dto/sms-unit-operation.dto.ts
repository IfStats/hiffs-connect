import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SmsUnitOperationDto {
  @IsInt()
  @Min(1)
  units!: number;

  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}
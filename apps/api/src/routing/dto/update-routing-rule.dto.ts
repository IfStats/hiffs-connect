import {
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateRoutingRuleDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
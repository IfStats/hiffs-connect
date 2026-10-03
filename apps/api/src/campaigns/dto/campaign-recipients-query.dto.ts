import {
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import {
  Type,
} from 'class-transformer';

export class CampaignRecipientsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(250)
  limit: number = 100;
}
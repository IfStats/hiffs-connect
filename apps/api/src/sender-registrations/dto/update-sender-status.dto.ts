import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum SenderStatusDto {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export class UpdateSenderStatusDto {
  @IsEnum(SenderStatusDto)
  status!: SenderStatusDto;

  @IsOptional()
  @IsString()
  providerReference?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

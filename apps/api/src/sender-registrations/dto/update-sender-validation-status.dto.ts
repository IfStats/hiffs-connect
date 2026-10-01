import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export enum SenderValidationStatusDto {
  PENDING =
    'PENDING',

  INTERNAL_REVIEW =
    'INTERNAL_REVIEW',

  DOCUMENTS_REQUIRED =
    'DOCUMENTS_REQUIRED',

  READY_FOR_PROVIDER =
    'READY_FOR_PROVIDER',

  PROVIDER_SUBMITTED =
    'PROVIDER_SUBMITTED',

  PROVIDER_PENDING =
    'PROVIDER_PENDING',

  APPROVED =
    'APPROVED',

  REJECTED =
    'REJECTED',

  SUSPENDED =
    'SUSPENDED',
}

export class UpdateSenderValidationStatusDto {
  @IsEnum(
    SenderValidationStatusDto,
  )
  status!: SenderValidationStatusDto;

  @IsOptional()
  @IsString()
  providerReference?: string;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
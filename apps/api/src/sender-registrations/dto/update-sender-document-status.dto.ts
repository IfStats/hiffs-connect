import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export enum SenderDocumentStatusDto {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class UpdateSenderDocumentStatusDto {
  @IsEnum(
    SenderDocumentStatusDto,
  )
  status!: SenderDocumentStatusDto;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
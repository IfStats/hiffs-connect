import {
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateSenderDocumentDto {
  @IsString()
  documentType!: string;

  @IsString()
  fileName!: string;

  @IsUrl()
  fileUrl!: string;
}
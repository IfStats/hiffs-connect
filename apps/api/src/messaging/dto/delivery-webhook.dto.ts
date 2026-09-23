import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeliveryWebhookDto {
  @IsString()
  @IsNotEmpty()
  providerMessageId!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsOptional()
  @IsString()
  failureReason?: string;
}

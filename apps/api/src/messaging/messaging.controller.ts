import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiKeyGuard, type ApiKeyRequest } from '../api-keys/api-key.guard.js';

import type { Response } from 'express';
import { MessagingService } from './messaging.service.js';
import { SendSmsDto } from './dto/send-sms.dto.js';
import { DeliveryWebhookDto } from './dto/delivery-webhook.dto.js';
import { InfobipDeliveryReportDto } from './dto/infobip-delivery-report.dto.js';
import { RouteMobileDeliveryReportDto } from './dto/routemobile-delivery-report.dto.js';

@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('sms')
  @UseGuards(ApiKeyGuard)
  sendSms(@Body() dto: SendSmsDto, @Req() request: ApiKeyRequest) {
    return this.messagingService.sendSms(
      dto,
      request.apiKeyContext!.businessId,
    );
  }

  @Get('messages')
  getMessages() {
    return this.messagingService.getMessages();
  }

  @Get('messages/:id')
  getMessage(@Param('id') id: string) {
    return this.messagingService.getMessage(id);
  }

  @Get('reports/summary')
  getSummary() {
    return this.messagingService.getSummary();
  }

  @Post('webhooks/delivery')
  handleDeliveryWebhook(@Body() dto: DeliveryWebhookDto) {
    return this.messagingService.handleDeliveryWebhook(dto);
  }

  @Post('webhooks/infobip')
  handleInfobipDeliveryReport(@Body() dto: InfobipDeliveryReportDto) {
    return this.messagingService.handleInfobipDeliveryReport(dto);
  }

  @Post('webhooks/routemobile')
  handleRouteMobileDeliveryReport(@Body() dto: RouteMobileDeliveryReportDto) {
    return this.messagingService.handleRouteMobileDeliveryReport(dto);
  }

  @Get('providers/routemobile/coverage-map')
  async downloadRouteMobileCoverageMap(@Res() res: Response) {
    const file = await this.messagingService.downloadRouteMobileCoverageMap();

    res.setHeader('Content-Type', file.contentType);

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="routemobile-coverage-map.xlsx"',
    );

    res.send(file.data);
  }

  @Get('messages/:id/routing-attempts')
  getRoutingAttempts(@Param('id') id: string) {
    return this.messagingService.getRoutingAttempts(id);
  }
}

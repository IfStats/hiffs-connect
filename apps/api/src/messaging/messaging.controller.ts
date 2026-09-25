import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiKeyGuard, type ApiKeyRequest } from '../api-keys/api-key.guard.js';

import type { Response } from 'express';
import { MessagingService } from './messaging.service.js';
import { SendSmsDto } from './dto/send-sms.dto.js';
import { InfobipDeliveryReportDto } from './dto/infobip-delivery-report.dto.js';
import { RouteMobileDeliveryReportDto } from './dto/routemobile-delivery-report.dto.js';
import { ApiAuthGuard } from '../auth/api-auth.guard.js';
import { BusinessPermissionGuard } from '../authz/business-permission.guard.js';
import { Permission } from '../authz/permission.enum.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';
import { InfobipWebhookGuard } from './infobip-webhook.guard.js';
import { RouteMobileWebhookGuard } from './routemobile-webhook.guard.js';

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

  @Post('business/:businessId/sms')
@UseGuards(
  ApiAuthGuard,
  BusinessPermissionGuard,
)
@RequirePermissions(
  Permission.MESSAGE_SEND,
)
sendBusinessSms(
  @Param('businessId')
  businessId: string,

  @Body()
  dto: SendSmsDto,
) {
  return this.messagingService.sendSms(
    dto,
    businessId,
  );
}

  @Get('business/:businessId/messages')
@UseGuards(
  ApiAuthGuard,
  BusinessPermissionGuard,
)
@RequirePermissions(Permission.MESSAGE_READ)
getMessages(
  @Param('businessId')
  businessId: string,
) {
  return this.messagingService.getMessages(
    businessId,
  );
}

@Get('business/:businessId/messages/:id')
@UseGuards(
  ApiAuthGuard,
  BusinessPermissionGuard,
)
@RequirePermissions(Permission.MESSAGE_READ)
getMessage(
  @Param('businessId')
  businessId: string,

  @Param('id')
  id: string,
) {
  return this.messagingService.getMessage(
    businessId,
    id,
  );
}

@Get('business/:businessId/reports/summary')
@UseGuards(
  ApiAuthGuard,
  BusinessPermissionGuard,
)
@RequirePermissions(Permission.MESSAGE_READ)
getSummary(
  @Param('businessId')
  businessId: string,
) {
  return this.messagingService.getSummary(
    businessId,
  );
}

@Get(
  'business/:businessId/messages/:id/routing-attempts',
)
@UseGuards(
  ApiAuthGuard,
  BusinessPermissionGuard,
)
@RequirePermissions(Permission.MESSAGE_READ)
getRoutingAttempts(
  @Param('businessId')
  businessId: string,

  @Param('id')
  id: string,
) {
  return this.messagingService.getRoutingAttempts(
    businessId,
    id,
  );
}
  @Post('webhooks/infobip')
@UseGuards(InfobipWebhookGuard)
handleInfobipDeliveryReport(
  @Body()
  dto: InfobipDeliveryReportDto,
) {
  return this.messagingService.handleInfobipDeliveryReport(
    dto,
  );
}

  @Get('webhooks/routemobile')
@UseGuards(RouteMobileWebhookGuard)
handleRouteMobileDeliveryReport(
  @Query()
  dto: RouteMobileDeliveryReportDto,
) {
  return this.messagingService.handleRouteMobileDeliveryReport(
    dto,
  );
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
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  CreateFxQuoteDto,
} from './dto/create-fx-quote.dto.js';

import { ApiAuthGuard } from '../auth/api-auth.guard.js';
import { BusinessPermissionGuard } from '../authz/business-permission.guard.js';
import { Permission } from '../authz/permission.enum.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';

import { WalletsService } from './wallets.service.js';

import type {
  Request,
} from 'express';

import type {
  AuthUser,
} from '../auth/auth-user.type.js';

type AuthenticatedRequest =
  Request & {
    user?: AuthUser;
  };

@Controller('wallets')
@UseGuards(
  ApiAuthGuard,
  BusinessPermissionGuard,
)
export class WalletsController {
  constructor(
    private readonly walletsService: WalletsService,
  ) {}

  @Get(':businessId')
  @RequirePermissions(
    Permission.WALLET_READ,
  )
  getWallet(
    @Param('businessId')
    businessId: string,
  ) {
    return this.walletsService.getWallet(
      businessId,
    );
  }

  @Get(':businessId/transactions')
  @RequirePermissions(
    Permission.WALLET_TRANSACTION_READ,
  )
  getTransactions(
    @Param('businessId')
    businessId: string,
  ) {
    return this.walletsService.getTransactions(
      businessId,
    );
  }

  @Get(':businessId/sms-units/transactions')
@RequirePermissions(
  Permission.WALLET_TRANSACTION_READ,
)
getSmsUnitTransactions(
  @Param('businessId')
  businessId: string,
) {
  return this.walletsService.getSmsUnitTransactions(
    businessId,
  );
}

@Post(':businessId/fx/quote')
@RequirePermissions(
  Permission.WALLET_FX,
)
createFxQuote(
  @Param('businessId')
  businessId: string,

  @Body()
  dto: CreateFxQuoteDto,
) {
  return this.walletsService.createFxQuote(
    businessId,
    dto,
  );
}

@Post(
  ':businessId/fx/:quoteId/confirm',
)
@RequirePermissions(
  Permission.WALLET_FX,
)
confirmFxQuote(
  @Param('businessId')
  businessId: string,

  @Param('quoteId')
  quoteId: string,

  @Req()
  request: AuthenticatedRequest,
) {
  return this.walletsService.confirmFxQuote(
    businessId,
    quoteId,
    request.user!.id,
  );
}
}
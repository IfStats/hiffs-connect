import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import { ApiAuthGuard } from '../auth/api-auth.guard.js';
import { BusinessPermissionGuard } from '../authz/business-permission.guard.js';
import { Permission } from '../authz/permission.enum.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';

import { WalletsService } from './wallets.service.js';

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
}
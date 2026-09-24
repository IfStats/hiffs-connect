import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { WalletsService } from './wallets.service.js';
import { TopUpWalletDto } from './dto/top-up-wallet.dto.js';
import { AdjustWalletDto } from './dto/adjust-wallet.dto.js';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get(':businessId')
  getWallet(
    @Param('businessId')
    businessId: string,
  ) {
    return this.walletsService.getWallet(businessId);
  }

  @Post(':businessId/top-up')
  topUp(
    @Param('businessId')
    businessId: string,

    @Body()
    dto: TopUpWalletDto,
  ) {
    return this.walletsService.topUp(businessId, dto);
  }

  @Post(':businessId/adjust')
  adjust(
    @Param('businessId')
    businessId: string,

    @Body()
    dto: AdjustWalletDto,
  ) {
    return this.walletsService.adjust(businessId, dto);
  }

  @Get(':businessId/transactions')
  getTransactions(
    @Param('businessId')
    businessId: string,
  ) {
    return this.walletsService.getTransactions(businessId);
  }
}

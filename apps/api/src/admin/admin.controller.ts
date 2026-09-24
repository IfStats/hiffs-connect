import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Patch,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { ApiAuthGuard } from '../auth/api-auth.guard.js';
import type { AuthUser } from '../auth/auth-user.type.js';
import { Permission } from '../authz/permission.enum.js';
import { PlatformPermissionGuard } from '../authz/platform-permission.guard.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';

import { AdminService } from './admin.service.js';
import { WalletOperationDto } from './dto/wallet-operation.dto.js';
import { UpdateAccountStatusDto } from './dto/update-account-status.dto.js';
import { UpdatePlatformRoleDto } from './dto/update-platform-role.dto.js';

type AuthenticatedRequest = Request & {
  user: AuthUser;
};

@Controller('admin')
@UseGuards(ApiAuthGuard, PlatformPermissionGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('businesses')
  @RequirePermissions(Permission.BUSINESS_READ)
  listBusinesses() {
    return this.adminService.listBusinesses();
  }

  @Get('businesses/:id')
  @RequirePermissions(Permission.BUSINESS_READ)
  getBusiness(@Param('id') id: string) {
    return this.adminService.getBusiness(id);
  }

  @Get('businesses/:businessId/wallet/transactions')
  @RequirePermissions(Permission.WALLET_TRANSACTION_READ)
  getWalletTransactions(
    @Param('businessId') businessId: string,
  ) {
    return this.adminService.getWalletTransactions(businessId);
  }

  @Post('businesses/:businessId/wallet/credit')
  @RequirePermissions(Permission.WALLET_ADMIN_CREDIT)
  creditWallet(
    @Param('businessId') businessId: string,
    @Body() dto: WalletOperationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.creditWallet(
      businessId,
      request.user.id,
      dto,
    );
  }

  @Post('businesses/:businessId/wallet/debit')
  @RequirePermissions(Permission.WALLET_ADMIN_DEBIT)
  debitWallet(
    @Param('businessId') businessId: string,
    @Body() dto: WalletOperationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.debitWallet(
      businessId,
      request.user.id,
      dto,
    );
  }

  @Post('businesses/:businessId/wallet/refund')
  @RequirePermissions(Permission.WALLET_ADMIN_REFUND)
  refundWallet(
    @Param('businessId') businessId: string,
    @Body() dto: WalletOperationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.refundWallet(
      businessId,
      request.user.id,
      dto,
    );
  }

  @Get('users')
@RequirePermissions(Permission.USER_READ)
listUsers() {
  return this.adminService.listUsers();
}

@Get('users/:id')
@RequirePermissions(Permission.USER_READ)
getUser(@Param('id') id: string) {
  return this.adminService.getUser(id);
}

@Patch('users/:id/status')
@RequirePermissions(Permission.USER_MANAGE)
updateUserStatus(
  @Param('id') id: string,
  @Body() dto: UpdateAccountStatusDto,
  @Req() request: AuthenticatedRequest,
) {
  return this.adminService.updateUserStatus(
    id,
    request.user.id,
    dto,
  );
}

@Patch('businesses/:id/status')
@RequirePermissions(Permission.BUSINESS_SUSPEND)
updateBusinessStatus(
  @Param('id') id: string,
  @Body() dto: UpdateAccountStatusDto,
) {
  return this.adminService.updateBusinessStatus(
    id,
    dto,
  );
}

@Patch('users/:id/platform-role')
@RequirePermissions(Permission.PLATFORM_ROLE_MANAGE)
updatePlatformRole(
  @Param('id') id: string,
  @Body() dto: UpdatePlatformRoleDto,
  @Req() request: AuthenticatedRequest,
) {
  return this.adminService.updatePlatformRole(
    id,
    request.user.id,
    dto,
  );
}
}
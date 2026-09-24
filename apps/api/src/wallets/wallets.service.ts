import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service.js';
import { TopUpWalletDto } from './dto/top-up-wallet.dto.js';
import { AdjustWalletDto } from './dto/adjust-wallet.dto.js';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: {
        id: businessId,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    let wallet = await this.prisma.wallet.findUnique({
      where: {
        businessId,
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          businessId,
          currency: 'USD',
          balance: new Prisma.Decimal(0),
        },
      });
    }

    return wallet;
  }

  async topUp(businessId: string, dto: TopUpWalletDto) {
    const wallet = await this.getWallet(businessId);

    const currency = dto.currency.toUpperCase();

    if (wallet.currency !== currency) {
      throw new BadRequestException(
        `Wallet currency is ${wallet.currency}, not ${currency}`,
      );
    }

    const amount = new Prisma.Decimal(dto.amount.toString());

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.wallet.findUniqueOrThrow({
        where: {
          id: wallet.id,
        },
      });

      const balanceBefore = current.balance;

      const balanceAfter = balanceBefore.plus(amount);

      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },

        data: {
          balance: balanceAfter,
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,

          type: 'TOP_UP',

          status: 'COMPLETED',

          amount,

          currency,

          balanceBefore,

          balanceAfter,

          reference: dto.reference,

          description: dto.description ?? 'Wallet top-up',
        },
      });

      return {
        wallet: updatedWallet,

        transaction,
      };
    });
  }

  async getTransactions(businessId: string) {
    const wallet = await this.getWallet(businessId);

    return this.prisma.walletTransaction.findMany({
      where: {
        walletId: wallet.id,
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 100,
    });
  }

  async adjust(businessId: string, dto: AdjustWalletDto) {
    const wallet = await this.getWallet(businessId);

    const amount = new Prisma.Decimal(dto.amount.toString());

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.wallet.findUniqueOrThrow({
        where: {
          id: wallet.id,
        },
      });

      const balanceBefore = current.balance;

      const balanceAfter = balanceBefore.plus(amount);

      if (balanceAfter.lt(0)) {
        throw new BadRequestException(
          'Adjustment would produce a negative wallet balance',
        );
      }

      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },

        data: {
          balance: balanceAfter,
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,

          type: 'ADJUSTMENT',

          status: 'COMPLETED',

          amount,

          currency: wallet.currency,

          balanceBefore,

          balanceAfter,

          reference: dto.reference,

          description: dto.description ?? 'Wallet adjustment',
        },
      });

      return {
        wallet: updatedWallet,

        transaction,
      };
    });
  }
}

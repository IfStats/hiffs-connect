import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  currencyForCountry,
} from '../common/country-currency.js';

import {
  CreateFxQuoteDto,
} from './dto/create-fx-quote.dto.js';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service.js';
import { TopUpWalletDto } from './dto/top-up-wallet.dto.js';
import { AdjustWalletDto } from './dto/adjust-wallet.dto.js';

import {
  FxRateService,
} from './fx-rate.service.js';

@Injectable()
export class WalletsService {
  constructor(
  private readonly prisma:
    PrismaService,

  private readonly fxRateService:
    FxRateService,
) {}

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
      wallet =
  await this.prisma.wallet.create({
    data: {
      businessId,

      currency:
        business.billingCurrency ??
        currencyForCountry(
          business.countryCode,
        ),

      balance:
        new Prisma.Decimal(0),
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

  async getSmsUnitTransactions(
  businessId: string,
) {
  const wallet =
    await this.getWallet(
      businessId,
    );

  return this.prisma.smsUnitTransaction.findMany({
    where: {
      walletId:
        wallet.id,
    },

    orderBy: {
      createdAt:
        'desc',
    },

    take: 100,

    select: {
      id: true,

      type: true,
      status: true,

      units: true,

      balanceBefore: true,
      balanceAfter: true,

      reference: true,
      description: true,

      messageId: true,

      createdAt: true,

      message: {
        select: {
          id: true,
          recipient: true,
          status: true,
          segmentCount: true,
        },
      },
    },
  });
}

async createFxQuote(
  businessId: string,
  dto: CreateFxQuoteDto,
) {
  const wallet =
    await this.getWallet(
      businessId,
    );

  const fromCurrency =
    wallet.currency
      .trim()
      .toUpperCase();

  const toCurrency =
    dto.toCurrency
      .trim()
      .toUpperCase();

  if (
    fromCurrency ===
    toCurrency
  ) {
    throw new BadRequestException(
      `Wallet is already denominated in ${toCurrency}`,
    );
  }

  /*
   * We are deliberately not inventing
   * an FX rate here.
   *
   * A real rate provider will be
   * connected in the next step.
   */
  const fxRate =
  await this.fxRateService.getRate(
    fromCurrency,
    toCurrency,
  );

const marketRate =
  fxRate.rate;

/*
 * No Hiffs FX markup yet.
 * When we introduce an FX spread,
 * appliedRate may differ from
 * marketRate.
 */
const appliedRate =
  marketRate;

  const sourceAmount =
    wallet.balance;

  const targetAmount =
    sourceAmount.mul(
      appliedRate,
    );

  const expiresAt =
    new Date(
      Date.now() +
        5 *
          60 *
          1000,
    );

  const quote =
    await this.prisma.walletFxConversion.create({
      data: {
        walletId:
          wallet.id,

        fromCurrency,

        toCurrency,

        sourceAmount,

        targetAmount,

        marketRate,

        appliedRate,

        feeAmount:
          new Prisma.Decimal(0),

        feeCurrency:
          fromCurrency,

        provider:
  fxRate.provider,

providerReference:
  fxRate.providerReference,

        status:
          'QUOTED',

        expiresAt,
      },
    });

  return {
    id:
      quote.id,

    status:
      quote.status,

    fromCurrency:
      quote.fromCurrency,

    toCurrency:
      quote.toCurrency,

    sourceAmount:
      quote.sourceAmount,

    targetAmount:
      quote.targetAmount,

    marketRate:
      quote.marketRate,

    appliedRate:
      quote.appliedRate,

    feeAmount:
      quote.feeAmount,

    feeCurrency:
      quote.feeCurrency,

    provider:
      quote.provider,

    expiresAt:
      quote.expiresAt,
  };
}

async confirmFxQuote(
  businessId: string,
  quoteId: string,
  actorUserId: string,
) {
  const quote =
    await this.prisma.walletFxConversion.findFirst({
      where: {
        id:
          quoteId,

        wallet: {
          businessId,
        },
      },

      include: {
        wallet: true,
      },
    });

  if (!quote) {
    throw new NotFoundException(
      'FX quote not found',
    );
  }

  if (
    quote.status ===
    'COMPLETED'
  ) {
    return {
      conversion:
        quote,

      wallet:
        quote.wallet,
    };
  }

  if (
    quote.status !==
    'QUOTED'
  ) {
    throw new BadRequestException(
      `FX quote cannot be confirmed from status ${quote.status}`,
    );
  }

  if (
    quote.expiresAt.getTime() <=
    Date.now()
  ) {
    await this.prisma.walletFxConversion.update({
      where: {
        id:
          quote.id,
      },

      data: {
        status:
          'EXPIRED',
      },
    });

    throw new BadRequestException(
      'FX quote has expired. Request a new quote.',
    );
  }

  return this.prisma.$transaction(
    async (tx) => {
      /*
       * Re-read every financial value
       * inside the transaction.
       */
      const currentQuote =
        await tx.walletFxConversion.findUniqueOrThrow({
          where: {
            id:
              quote.id,
          },
        });

      if (
        currentQuote.status ===
        'COMPLETED'
      ) {
        const existingWallet =
          await tx.wallet.findUniqueOrThrow({
            where: {
              id:
                currentQuote.walletId,
            },
          });

        return {
          conversion:
            currentQuote,

          wallet:
            existingWallet,
        };
      }

      if (
        currentQuote.status !==
        'QUOTED'
      ) {
        throw new BadRequestException(
          `FX quote cannot be confirmed from status ${currentQuote.status}`,
        );
      }

      if (
        currentQuote.expiresAt.getTime() <=
        Date.now()
      ) {
        await tx.walletFxConversion.update({
          where: {
            id:
              currentQuote.id,
          },

          data: {
            status:
              'EXPIRED',
          },
        });

        throw new BadRequestException(
          'FX quote has expired. Request a new quote.',
        );
      }

      const wallet =
        await tx.wallet.findUniqueOrThrow({
          where: {
            id:
              currentQuote.walletId,
          },
        });

      if (
        wallet.businessId !==
        businessId
      ) {
        throw new BadRequestException(
          'FX quote does not belong to this business',
        );
      }

      if (
        wallet.currency !==
        currentQuote.fromCurrency
      ) {
        throw new BadRequestException(
          `Wallet currency changed after this quote was created. Expected ${currentQuote.fromCurrency}, found ${wallet.currency}.`,
        );
      }

      /*
       * A quote represents the wallet
       * balance at one point in time.
       *
       * If the wallet was credited or
       * debited after quoting, force a
       * fresh quote rather than converting
       * a stale amount.
       */
      if (
        !wallet.balance.equals(
          currentQuote.sourceAmount,
        )
      ) {
        throw new BadRequestException(
          'Wallet balance changed after this FX quote was created. Request a new quote.',
        );
      }

      const now =
        new Date();

      /*
       * Update wallet denomination and
       * converted monetary value together.
       *
       * SMS units are deliberately untouched.
       */
      const updatedWallet =
        await tx.wallet.update({
          where: {
            id:
              wallet.id,
          },

          data: {
            currency:
              currentQuote.toCurrency,

            balance:
              currentQuote.targetAmount,
          },
        });

      /*
       * The business billing currency now
       * follows the completed wallet
       * conversion.
       */
      await tx.business.update({
        where: {
          id:
            businessId,
        },

        data: {
          billingCurrency:
            currentQuote.toCurrency,
        },
      });

      const conversion =
        await tx.walletFxConversion.update({
          where: {
            id:
              currentQuote.id,
          },

          data: {
            status:
              'COMPLETED',

            performedByUserId:
              actorUserId,

            confirmedAt:
              now,

            completedAt:
              now,
          },
        });

      return {
        conversion,

        wallet:
          updatedWallet,
      };
    },
  );
}
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreatePricingDto } from './dto/create-pricing.dto.js';

import {
  currencyForCountry,
} from '../common/country-currency.js';

import {
  CreateSenderRegistrationPricingDto,
} from './dto/create-sender-registration-pricing.dto.js';

import {
  ReplaceSenderRegistrationPricingDto,
} from './dto/replace-sender-registration-pricing.dto.js';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePricingDto) {
  const countryCode =
    dto.countryCode
      .trim()
      .toUpperCase();

  const currency =
    currencyForCountry(
      countryCode,
    );

  return this.prisma.countryPricing.create({
    data: {
      countryCode,

      countryName:
        dto.countryName.trim(),

      channel:
        dto.channel,

      network:
        dto.network?.trim() ||
        null,

      provider:
        dto.provider ??
        'infobip',

      providerCost:
        dto.providerCost,

      retailPrice:
        dto.retailPrice,

      currency,

      minVolume:
        dto.minVolume,

      maxVolume:
        dto.maxVolume,

      status:
        'ACTIVE',
    },
  });
}

  findAll() {
    return this.prisma.countryPricing.findMany({
      orderBy: [
        { countryCode: 'asc' },
        { channel: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const pricing = await this.prisma.countryPricing.findUnique({
      where: { id },
    });

    if (!pricing) {
      throw new NotFoundException('Pricing record not found');
    }

    return pricing;
  }

  async createSenderRegistrationPricing(
  dto: CreateSenderRegistrationPricingDto,
) {
  const provider =
    dto.provider
      .trim()
      .toLowerCase();

  const countryCode =
    dto.countryCode
      .trim()
      .toUpperCase();

  const providerCostCurrency =
    dto.providerCostCurrency
      .trim()
      .toUpperCase();

  const currency =
    dto.currency
      .trim()
      .toUpperCase();

  const now =
    new Date();

  const existing =
    await this.prisma.senderRegistrationPricing.findFirst({
      where: {
        provider,
        countryCode,

        channel:
          dto.channel,

        senderType:
          dto.senderType,

        currency,

        active:
          true,

        effectiveFrom: {
          lte:
            now,
        },

        OR: [
          {
            effectiveTo:
              null,
          },
          {
            effectiveTo: {
              gt:
                now,
            },
          },
        ],
      },
    });

  if (existing) {
    throw new BadRequestException(
      `Active sender registration pricing already exists for ${provider}/${countryCode}/${dto.channel}/${dto.senderType} in ${currency}. Deactivate the existing pricing before creating a replacement.`,
    );
  }

  return this.prisma.senderRegistrationPricing.create({
    data: {
      provider,
      countryCode,

      channel:
        dto.channel,

      senderType:
        dto.senderType,

      providerCost:
        dto.providerCost,

      providerCostCurrency,

      retailPrice:
        dto.retailPrice,

      currency,

      active:
        true,

      effectiveFrom:
        now,
    },
  });
}

findSenderRegistrationPricing() {
  return this.prisma.senderRegistrationPricing.findMany({
    orderBy: [
      {
        countryCode:
          'asc',
      },
      {
        provider:
          'asc',
      },
      {
        channel:
          'asc',
      },
      {
        senderType:
          'asc',
      },
      {
        effectiveFrom:
          'desc',
      },
    ],
  });
}

async deactivateSenderRegistrationPricing(
  id: string,
) {
  const pricing =
    await this.prisma.senderRegistrationPricing.findUnique({
      where: {
        id,
      },
    });

  if (!pricing) {
    throw new NotFoundException(
      'Sender registration pricing not found',
    );
  }

  if (!pricing.active) {
    return pricing;
  }

  const now =
    new Date();

  return this.prisma.senderRegistrationPricing.update({
    where: {
      id,
    },

    data: {
      active:
        false,

      effectiveTo:
        pricing.effectiveTo ??
        now,
    },
  });
}

async replaceSenderRegistrationPricing(
  id: string,
  dto: ReplaceSenderRegistrationPricingDto,
) {
  const existing =
    await this.prisma.senderRegistrationPricing.findUnique({
      where: {
        id,
      },
    });

  if (!existing) {
    throw new NotFoundException(
      'Sender registration pricing not found',
    );
  }

  if (!existing.active) {
    throw new BadRequestException(
      'Only active sender registration pricing can be replaced',
    );
  }

  const currency =
    dto.currency
      .trim()
      .toUpperCase();

  const providerCostCurrency =
    dto.providerCostCurrency
      .trim()
      .toUpperCase();

  const now =
    new Date();

  return this.prisma.$transaction(
    async (tx) => {
      await tx.senderRegistrationPricing.update({
        where: {
          id:
            existing.id,
        },

        data: {
          active:
            false,

          effectiveTo:
            now,
        },
      });

      return tx.senderRegistrationPricing.create({
        data: {
          provider:
            existing.provider,

          countryCode:
            existing.countryCode,

          channel:
            existing.channel,

          senderType:
            existing.senderType,

          providerCost:
            dto.providerCost,

          providerCostCurrency,

          retailPrice:
            dto.retailPrice,

          currency,

          active:
            true,

          effectiveFrom:
            now,
        },
      });
    },
  );
}
}

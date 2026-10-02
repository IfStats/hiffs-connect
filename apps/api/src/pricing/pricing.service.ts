import {
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

  createSenderRegistrationPricing(
  dto: CreateSenderRegistrationPricingDto,
) {
  return this.prisma.senderRegistrationPricing.create({
    data: {
      provider:
        dto.provider
          .trim()
          .toLowerCase(),

      countryCode:
        dto.countryCode
          .trim()
          .toUpperCase(),

      channel:
        dto.channel,

      senderType:
        dto.senderType,

      providerCost:
        dto.providerCost,

      providerCostCurrency:
        dto.providerCostCurrency
          .trim()
          .toUpperCase(),

      retailPrice:
        dto.retailPrice,

      currency:
        dto.currency
          .trim()
          .toUpperCase(),

      active:
        true,
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
}

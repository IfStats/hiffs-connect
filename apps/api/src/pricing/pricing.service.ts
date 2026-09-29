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
}

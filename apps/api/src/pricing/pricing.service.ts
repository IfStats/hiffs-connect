import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreatePricingDto } from './dto/create-pricing.dto.js';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePricingDto) {
    if (dto.retailPrice < dto.providerCost) {
      throw new BadRequestException(
        'retailPrice cannot be lower than providerCost',
      );
    }

    return this.prisma.countryPricing.create({
      data: {
        countryCode: dto.countryCode.toUpperCase(),
        countryName: dto.countryName,
        channel: dto.channel,
        network: dto.network,
        provider: dto.provider ?? 'infobip',
        providerCost: dto.providerCost,
        retailPrice: dto.retailPrice,
        currency: dto.currency.toUpperCase(),
        minVolume: dto.minVolume,
        maxVolume: dto.maxVolume,
        status: 'ACTIVE',
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

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateRoutingRuleDto } from './dto/create-routing-rule.dto.js';

@Injectable()
export class RoutingService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  create(dto: CreateRoutingRuleDto) {
    return this.prisma.providerRoutingRule.create({
      data: {
        countryCode: dto.countryCode.toUpperCase(),
        channel: dto.channel,
        provider: dto.provider.toLowerCase(),
        network: dto.network,
        priority: dto.priority,
        enabled: dto.enabled ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.providerRoutingRule.findMany({
      orderBy: [
        {
          countryCode: 'asc',
        },
        {
          priority: 'asc',
        },
      ],
    });
  }

  async findOne(id: string) {
    const rule =
      await this.prisma.providerRoutingRule.findUnique({
        where: {
          id,
        },
      });

    if (!rule) {
      throw new NotFoundException(
        'Provider routing rule not found',
      );
    }

    return rule;
  }

  async update(
  id: string,
  dto: {
    priority?: number;
    enabled?: boolean;
  },
) {
  await this.findOne(id);

  return this.prisma.providerRoutingRule.update({
    where: {
      id,
    },
    data: {
      priority: dto.priority,
      enabled: dto.enabled,
    },
  });
}
}
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma.service.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateApiKeyDto) {
    const business = await this.prisma.business.findUnique({
      where: {
        id: businessId,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const rawSecret = randomBytes(32).toString('hex');

    const prefix = `hiffs_${randomBytes(4).toString('hex')}`;

    const apiKey = `${prefix}.${rawSecret}`;

    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    const lastFour = rawSecret.slice(-4);

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException('expiresAt must be in the future');
    }

    const created = await this.prisma.apiKey.create({
      data: {
        businessId,
        name: dto.name,
        prefix,
        keyHash,
        lastFour,
        expiresAt,
      },
    });

    return {
      id: created.id,
      businessId: created.businessId,
      name: created.name,
      prefix: created.prefix,
      lastFour: created.lastFour,
      enabled: created.enabled,
      expiresAt: created.expiresAt,
      createdAt: created.createdAt,

      /*
       * This is the only time the raw key is returned.
       */
      apiKey,
    };
  }

  findByBusiness(businessId: string) {
    return this.prisma.apiKey.findMany({
      where: {
        businessId,
      },

      select: {
        id: true,
        businessId: true,
        name: true,
        prefix: true,
        lastFour: true,
        enabled: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
        updatedAt: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async revoke(
  businessId: string,
  id: string,
) {
  const key =
    await this.prisma.apiKey.findFirst({
      where: {
        id,
        businessId,
      },
    });

  if (!key) {
    throw new NotFoundException(
      'API key not found',
    );
  }

  if (key.revokedAt) {
    return {
      id: key.id,
      enabled: false,
      revokedAt: key.revokedAt,
    };
  }

  const revokedAt = new Date();

  const updated =
    await this.prisma.apiKey.update({
      where: {
        id,
      },

      data: {
        enabled: false,
        revokedAt,
      },
    });

  return {
    id: updated.id,
    enabled: updated.enabled,
    revokedAt: updated.revokedAt,
  };
}

  async resolve(rawApiKey: string) {
    const keyHash = createHash('sha256').update(rawApiKey).digest('hex');

    const key = await this.prisma.apiKey.findUnique({
      where: {
        keyHash,
      },

      include: {
        business: true,
      },
    });

    if (!key) {
      return null;
    }

    if (
  !key.enabled ||
  key.revokedAt ||
  key.business.status !== 'ACTIVE' ||
  (key.expiresAt &&
    key.expiresAt <= new Date())
) {
  return null;
}

    await this.prisma.apiKey.update({
      where: {
        id: key.id,
      },

      data: {
        lastUsedAt: new Date(),
      },
    });

    return key;
  }
}

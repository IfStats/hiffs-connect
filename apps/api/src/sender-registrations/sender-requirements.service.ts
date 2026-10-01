import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service.js';

@Injectable()
export class SenderRequirementsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll(params: {
    provider?: string;
    countryCode?: string;
    channel?: 'SMS' | 'WHATSAPP';
    senderType?: 'SHARED' | 'DEDICATED';
  }) {
    return this.prisma.senderRequirement.findMany({
      where: {
        active: true,

        ...(params.provider
          ? {
              provider:
                params.provider
                  .trim()
                  .toLowerCase(),
            }
          : {}),

        ...(params.countryCode
          ? {
              countryCode:
                params.countryCode
                  .trim()
                  .toUpperCase(),
            }
          : {}),

        ...(params.channel
          ? {
              channel:
                params.channel,
            }
          : {}),

        ...(params.senderType
          ? {
              senderType:
                params.senderType,
            }
          : {}),
      },

      orderBy: [
        {
          countryCode: 'asc',
        },
        {
          key: 'asc',
        },
      ],
    });
  }
}
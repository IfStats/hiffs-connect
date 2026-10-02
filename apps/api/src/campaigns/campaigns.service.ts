import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PrismaService,
} from '../prisma.service.js';

import {
  CreateCampaignDto,
} from './dto/create-campaign.dto.js';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async create(
    businessId: string,
    dto: CreateCampaignDto,
  ) {
    const sender =
      await this.prisma.senderRegistration.findFirst({
        where: {
          id:
            dto.senderRegistrationId,

          businessId,

          status:
            'APPROVED',
        },

        select: {
          id: true,
          channel: true,
        },
      });

    if (!sender) {
      throw new NotFoundException(
        'Approved sender registration not found',
      );
    }

    if (
      sender.channel !==
      'SMS'
    ) {
      throw new BadRequestException(
        'Only SMS campaigns are currently supported',
      );
    }

    const recipients =
      Array.from(
        new Set(
          dto.recipients.map(
            (recipient) =>
              recipient.trim(),
          ),
        ),
      );

    const scheduledAt =
      dto.scheduledAt
        ? new Date(
            dto.scheduledAt,
          )
        : null;

    if (
      scheduledAt &&
      Number.isNaN(
        scheduledAt.getTime(),
      )
    ) {
      throw new BadRequestException(
        'scheduledAt must be a valid date',
      );
    }

    const status =
      scheduledAt &&
      scheduledAt.getTime() >
        Date.now()
        ? 'SCHEDULED'
        : 'DRAFT';

    return this.prisma.$transaction(
      async (tx) => {
        const campaign =
          await tx.campaign.create({
            data: {
              businessId,

              senderRegistrationId:
                sender.id,

              name:
                dto.name.trim(),

              channel:
                'SMS',

              content:
                dto.content.trim(),

              status,

              totalRecipients:
                recipients.length,

              scheduledAt,
            },
          });

        await tx.campaignRecipient.createMany({
          data:
            recipients.map(
              (recipient) => ({
                campaignId:
                  campaign.id,

                recipient,

                status:
                  'PENDING',
              }),
            ),
        });

        return tx.campaign.findUniqueOrThrow({
          where: {
            id:
              campaign.id,
          },

          include: {
            recipients: {
              orderBy: {
                createdAt:
                  'asc',
              },
            },
          },
        });
      },
    );
  }

  findByBusiness(
    businessId: string,
  ) {
    return this.prisma.campaign.findMany({
      where: {
        businessId,
      },

      orderBy: {
        createdAt:
          'desc',
      },

      include: {
        senderRegistration: {
          select: {
            id: true,
            senderValue: true,
          },
        },
      },
    });
  }

  async findOneForBusiness(
    businessId: string,
    id: string,
  ) {
    const campaign =
      await this.prisma.campaign.findFirst({
        where: {
          id,
          businessId,
        },

        include: {
          senderRegistration: {
            select: {
              id: true,
              senderValue: true,
            },
          },

          recipients: {
            orderBy: {
              createdAt:
                'asc',
            },
          },
        },
      });

    if (!campaign) {
      throw new NotFoundException(
        'Campaign not found',
      );
    }

    return campaign;
  }
}
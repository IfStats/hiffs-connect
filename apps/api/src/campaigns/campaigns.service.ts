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

    const clientRequestId =
  dto.clientRequestId
    .trim();

const existingCampaign =
  await this.prisma.campaign.findUnique({
    where: {
      businessId_clientRequestId: {
        businessId,
        clientRequestId,
      },
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

if (existingCampaign) {
  return existingCampaign;
}
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

              clientRequestId,

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

        const chunkSize =
  1000;

for (
  let index = 0;
  index < recipients.length;
  index += chunkSize
) {
  const chunk =
    recipients.slice(
      index,
      index +
        chunkSize,
    );

  await tx.campaignRecipient.createMany({
    data:
      chunk.map(
        (recipient) => ({
          campaignId:
            campaign.id,

          recipient,

          status:
            'PENDING',
        }),
      ),

    skipDuplicates:
      true,
  });
}

        return tx.campaign.findUniqueOrThrow({
  where: {
    id:
      campaign.id,
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
},
      });

    if (!campaign) {
      throw new NotFoundException(
        'Campaign not found',
      );
    }

    return campaign;
  }

  async findRecipients(
  businessId: string,
  campaignId: string,
  page: number,
  limit: number,
) {
  const campaign =
    await this.prisma.campaign.findFirst({
      where: {
        id:
          campaignId,

        businessId,
      },

      select: {
        id: true,
      },
    });

  if (!campaign) {
    throw new NotFoundException(
      'Campaign not found',
    );
  }

  const skip =
    (page - 1) *
    limit;

  const [
    recipients,
    total,
  ] =
    await this.prisma.$transaction([
      this.prisma.campaignRecipient.findMany({
        where: {
          campaignId,
        },

        orderBy: {
          createdAt:
            'asc',
        },

        skip,

        take:
          limit,
      }),

      this.prisma.campaignRecipient.count({
        where: {
          campaignId,
        },
      }),
    ]);

  return {
    data:
      recipients,

    pagination: {
      page,
      limit,
      total,

      totalPages:
        Math.ceil(
          total /
            limit,
        ),
    },
  };
}
}
import {
  Prisma,
  SmsUnitTransactionType,
  WalletTransactionStatus,
} from '@prisma/client';

import {
  calculateSmsUsage,
} from '../messaging/sms-usage.js';

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

async launch(
  businessId: string,
  campaignId: string,
) {
  const campaign =
    await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        businessId,
      },

      include: {
        senderRegistration: {
          select: {
            id: true,
            status: true,
            channel: true,
          },
        },
      },
    });

  if (!campaign) {
    throw new NotFoundException(
      'Campaign not found',
    );
  }

  if (
    campaign.status ===
      'QUEUED' ||
    campaign.status ===
      'PROCESSING' ||
    campaign.status ===
      'COMPLETED'
  ) {
    return campaign;
  }

  if (
    campaign.status ===
      'FAILED' ||
    campaign.status ===
      'CANCELLED' ||
    campaign.status ===
      'PARTIALLY_FAILED'
  ) {
    throw new BadRequestException(
      `Campaign cannot be launched from status ${campaign.status}`,
    );
  }

  if (
    campaign.senderRegistration
      .status !==
      'APPROVED' ||
    campaign.senderRegistration
      .channel !==
      'SMS'
  ) {
    throw new BadRequestException(
      'Campaign sender is not approved for SMS',
    );
  }

  if (
    campaign.scheduledAt &&
    campaign.scheduledAt.getTime() >
      Date.now()
  ) {
    throw new BadRequestException(
      'Future scheduled campaigns cannot be launched until their scheduled time',
    );
  }

  const content =
    campaign.content.trim();

  if (!content) {
    throw new BadRequestException(
      'Campaign message is empty',
    );
  }

  const smsUsage =
    calculateSmsUsage(
      content,
    );

  const recipientCount =
    await this.prisma.campaignRecipient.count({
      where: {
        campaignId:
          campaign.id,

        status:
          'PENDING',
      },
    });

  if (
    recipientCount ===
    0
  ) {
    throw new BadRequestException(
      'Campaign has no pending recipients',
    );
  }

  const requiredSmsUnits =
    smsUsage.segmentCount *
    recipientCount;

  try {
    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const existingReservation =
            await tx.smsUnitTransaction.findFirst({
              where: {
                campaignId:
                  campaign.id,

                type:
                  SmsUnitTransactionType.CAMPAIGN_RESERVATION,
              },
            });

          if (
            existingReservation
          ) {
            const existingCampaign =
              await tx.campaign.findUniqueOrThrow({
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

            return {
              campaign:
                existingCampaign,

              reservation:
                existingReservation,

              smsPagesPerRecipient:
                smsUsage.segmentCount,

              requiredSmsUnits:
                Math.abs(
                  existingReservation.units,
                ),
            };
          }

          const wallet =
            await tx.wallet.findUnique({
              where: {
                businessId,
              },
            });

          if (!wallet) {
            throw new BadRequestException(
              'Business wallet not found',
            );
          }

          const debitResult =
            await tx.wallet.updateMany({
              where: {
                id:
                  wallet.id,

                smsUnits: {
                  gte:
                    requiredSmsUnits,
                },
              },

              data: {
                smsUnits: {
                  decrement:
                    requiredSmsUnits,
                },
              },
            });

          if (
            debitResult.count !==
            1
          ) {
            throw new BadRequestException(
              `Insufficient SMS units. Campaign requires ${requiredSmsUnits} units.`,
            );
          }

          const updatedWallet =
            await tx.wallet.findUniqueOrThrow({
              where: {
                id:
                  wallet.id,
              },
            });

          const balanceAfter =
            updatedWallet.smsUnits;

          const balanceBefore =
            balanceAfter +
            requiredSmsUnits;

          const reservation =
            await tx.smsUnitTransaction.create({
              data: {
                walletId:
                  wallet.id,

                campaignId:
                  campaign.id,

                type:
                  SmsUnitTransactionType.CAMPAIGN_RESERVATION,

                status:
                  WalletTransactionStatus.COMPLETED,

                units:
                  -requiredSmsUnits,

                balanceBefore,

                balanceAfter,

                reference:
                  `campaign-${campaign.id}`,

                description:
                  `SMS units reserved for campaign ${campaign.name}`,
              },
            });

          const queuedAt =
            new Date();

          const queuedRecipients =
            await tx.campaignRecipient.updateMany({
              where: {
                campaignId:
                  campaign.id,

                status:
                  'PENDING',
              },

              data: {
                status:
                  'QUEUED',

                queuedAt,
              },
            });

          const updatedCampaign =
            await tx.campaign.update({
              where: {
                id:
                  campaign.id,
              },

              data: {
                status:
                  'QUEUED',

                queuedCount:
                  queuedRecipients.count,
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

          return {
            campaign:
              updatedCampaign,

            reservation,

            smsPagesPerRecipient:
              smsUsage.segmentCount,

            requiredSmsUnits,
          };
        },
      );

    return result;
  } catch (error) {
    /*
     * Concurrent launch requests may race.
     * The unique (campaignId, type)
     * constraint guarantees only one
     * reservation survives.
     */
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code ===
        'P2002'
    ) {
      const reservation =
        await this.prisma.smsUnitTransaction.findFirst({
          where: {
            campaignId:
              campaign.id,

            type:
              SmsUnitTransactionType.CAMPAIGN_RESERVATION,
          },
        });

      const existingCampaign =
        await this.prisma.campaign.findUniqueOrThrow({
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

      return {
        campaign:
          existingCampaign,

        reservation,

        smsPagesPerRecipient:
          smsUsage.segmentCount,

        requiredSmsUnits:
          reservation
            ? Math.abs(
                reservation.units,
              )
            : requiredSmsUnits,
      };
    }

    throw error;
  }
}
}
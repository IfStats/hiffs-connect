import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma.service.js';

import {
  CreateSenderRegistrationDto,
} from './dto/create-sender-registration.dto.js';

@Injectable()
export class SenderRegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    businessId: string,
    dto: CreateSenderRegistrationDto,
  ) {
    const business =
      await this.prisma.business.findUnique({
        where: {
          id: businessId,
        },

        select: {
          id: true,
        },
      });

    if (!business) {
      throw new BadRequestException(
        'Business does not exist',
      );
    }

    return this.prisma.senderRegistration.create({
      data: {
        businessId,

        channel:
          dto.channel,

        senderType:
          dto.senderType,

        senderValue:
          dto.senderValue.trim(),

        countryCode:
          dto.countryCode
            .trim()
            .toUpperCase(),

        destinationCountry:
          dto.destinationCountry
            ?.trim()
            .toUpperCase(),

        useCase:
          dto.useCase?.trim(),

        estimatedMonthlyVolume:
          dto.estimatedMonthlyVolume,

        provider:
          'infobip',

        status:
          'DRAFT',
      },

      select: {
        id: true,
        channel: true,
        senderType: true,
        senderValue: true,
        countryCode: true,
        destinationCountry: true,
        status: true,

        useCase: true,

        estimatedMonthlyVolume:
          true,

        rejectionReason: true,

        submittedAt: true,
        approvedAt: true,
        rejectedAt: true,

        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findByBusiness(
    businessId: string,
  ) {
    return this.prisma.senderRegistration.findMany({
      where: {
        businessId,
      },

      orderBy: {
        createdAt:
          'desc',
      },

      select: {
        id: true,
        channel: true,
        senderType: true,
        senderValue: true,

        countryCode: true,
        destinationCountry: true,

        status: true,

        useCase: true,

        estimatedMonthlyVolume:
          true,

        rejectionReason: true,

        submittedAt: true,
        approvedAt: true,
        rejectedAt: true,

        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOneForBusiness(
    businessId: string,
    id: string,
  ) {
    const registration =
      await this.prisma.senderRegistration.findFirst({
        where: {
          id,
          businessId,
        },

        select: {
          id: true,
          channel: true,
          senderType: true,
          senderValue: true,

          countryCode: true,
          destinationCountry: true,

          status: true,

          useCase: true,

          estimatedMonthlyVolume:
            true,

          rejectionReason: true,

          submittedAt: true,
          approvedAt: true,
          rejectedAt: true,

          createdAt: true,
          updatedAt: true,
        },
      });

    if (!registration) {
      throw new NotFoundException(
        'Sender registration not found',
      );
    }

    return registration;
  }

  async findOne(
  id: string,
) {
  const registration =
    await this.prisma.senderRegistration.findUnique({
      where: {
        id,
      },

      include: {
        business: true,

        validations: {
          orderBy: {
            createdAt:
              'desc',
          },
        },

        documents: {
          orderBy: {
            createdAt:
              'desc',
          },
        },
      },
    });

  if (!registration) {
    throw new NotFoundException(
      'Sender registration not found',
    );
  }

  const requirements =
    await this.prisma.senderRequirement.findMany({
      where: {
        active: true,

        provider:
          registration.provider,

        countryCode:
          registration.countryCode,

        channel:
          registration.channel,

        senderType:
          registration.senderType,
      },

      orderBy: [
        {
          required:
            'desc',
        },
        {
          key:
            'asc',
        },
      ],
    });

  return {
    ...registration,
    requirements,
  };
}

  async updateStatus(
  id: string,

  dto: {
    status:
      | 'DRAFT'
      | 'SUBMITTED'
      | 'PENDING'
      | 'APPROVED'
      | 'REJECTED'
      | 'SUSPENDED';

    providerReference?: string;
    rejectionReason?: string;
  },
) {
  const registration =
    await this.findOne(id);

  const status =
    dto.status;

  const allowedTransitions: Record<
    typeof registration.status,
    Array<typeof registration.status>
  > = {
    DRAFT: [
      'SUBMITTED',
    ],

    SUBMITTED: [
      'PENDING',
    ],

    PENDING: [
      'APPROVED',
      'REJECTED',
    ],

    APPROVED: [
      'SUSPENDED',
    ],

    REJECTED: [
      'DRAFT',
    ],

    SUSPENDED: [
      'APPROVED',
    ],
  };

  const allowed =
    allowedTransitions[
      registration.status
    ];

  if (
    !allowed.includes(
      status,
    )
  ) {
    throw new BadRequestException(
      `Invalid sender status transition: ${registration.status} -> ${status}`,
    );
  }

  if (
    status ===
      'REJECTED' &&
    !dto.rejectionReason
      ?.trim()
  ) {
    throw new BadRequestException(
      'rejectionReason is required when rejecting a sender registration',
    );
  }

  const now =
    new Date();

  return this.prisma.$transaction(
    async (tx) => {
      const updated =
        await tx.senderRegistration.update({
          where: {
            id,
          },

          data: {
            status,

            providerReference:
              dto.providerReference
                ?.trim() ||
              undefined,

            rejectionReason:
              status ===
              'REJECTED'
                ? dto.rejectionReason
                    ?.trim()
                : status ===
                    'DRAFT'
                  ? null
                  : undefined,

            submittedAt:
              status ===
              'SUBMITTED'
                ? now
                : status ===
                    'DRAFT'
                  ? null
                  : undefined,

            approvedAt:
              status ===
              'APPROVED'
                ? now
                : status ===
                    'DRAFT'
                  ? null
                  : undefined,

            rejectedAt:
              status ===
              'REJECTED'
                ? now
                : status ===
                    'DRAFT'
                  ? null
                  : undefined,
          },

          include: {
            business: true,
          },
        });

      const validation =
        await tx.senderValidation.findFirst({
          where: {
            senderRegistrationId:
              id,
          },

          orderBy: {
            createdAt:
              'desc',
          },
        });

      if (
        validation &&
        status !== 'DRAFT'
      ) {
        const validationStatus =
          status ===
          'PENDING'
            ? 'INTERNAL_REVIEW'
            : status ===
                'APPROVED'
              ? 'APPROVED'
              : status ===
                  'REJECTED'
                ? 'REJECTED'
                : status ===
                    'SUSPENDED'
                  ? 'SUSPENDED'
                  : null;

        if (
          validationStatus
        ) {
          await tx.senderValidation.update({
            where: {
              id:
                validation.id,
            },

            data: {
              status:
                validationStatus,

              providerReference:
                dto.providerReference
                  ?.trim() ||
                undefined,

              reviewNotes:
                status ===
                'REJECTED'
                  ? dto.rejectionReason
                      ?.trim()
                  : undefined,

              completedAt:
                status ===
                  'APPROVED' ||
                status ===
                  'REJECTED'
                  ? now
                  : undefined,
            },
          });
        }
      }

      return updated;
    },
  );
}

  async submitForReview(
  businessId: string,
  id: string,
) {
  const registration =
    await this.prisma.senderRegistration.findFirst({
      where: {
        id,
        businessId,
      },
    });

  if (!registration) {
    throw new NotFoundException(
      'Sender registration not found',
    );
  }

  if (
    registration.status !==
    'DRAFT'
  ) {
    throw new BadRequestException(
      `Only DRAFT sender registrations can be submitted. Current status: ${registration.status}`,
    );
  }

  const submittedAt =
    new Date();

  return this.prisma.$transaction(
    async (tx) => {
      const updated =
        await tx.senderRegistration.update({
          where: {
            id,
          },

          data: {
            status:
              'SUBMITTED',

            submittedAt,
          },

          select: {
            id: true,
            channel: true,
            senderType: true,
            senderValue: true,
            countryCode: true,
            destinationCountry: true,
            status: true,
            useCase: true,
            estimatedMonthlyVolume:
              true,
            rejectionReason:
              true,
            submittedAt:
              true,
            approvedAt:
              true,
            rejectedAt:
              true,
            createdAt:
              true,
            updatedAt:
              true,
          },
        });

      await tx.senderValidation.create({
        data: {
          senderRegistrationId:
            id,

          provider:
            registration.provider,

          countryCode:
            registration.countryCode,

          status:
            'PENDING',
        },
      });

      return updated;
    },
  );
}

async updateValidationStatus(
  senderRegistrationId: string,

  dto: {
    status:
      | 'PENDING'
      | 'INTERNAL_REVIEW'
      | 'DOCUMENTS_REQUIRED'
      | 'READY_FOR_PROVIDER'
      | 'PROVIDER_SUBMITTED'
      | 'PROVIDER_PENDING'
      | 'APPROVED'
      | 'REJECTED'
      | 'SUSPENDED';

    providerReference?: string;
    reviewNotes?: string;
  },
) {
  const validation =
    await this.prisma.senderValidation.findFirst({
      where: {
        senderRegistrationId,
      },

      orderBy: {
        createdAt:
          'desc',
      },
    });

  if (!validation) {
    throw new NotFoundException(
      'Sender validation not found',
    );
  }

  const status =
    dto.status;

  const allowedTransitions: Record<
    typeof validation.status,
    Array<typeof validation.status>
  > = {
    PENDING: [
      'INTERNAL_REVIEW',
    ],

    INTERNAL_REVIEW: [
      'DOCUMENTS_REQUIRED',
      'READY_FOR_PROVIDER',
      'REJECTED',
    ],

    DOCUMENTS_REQUIRED: [
      'INTERNAL_REVIEW',
      'REJECTED',
    ],

    READY_FOR_PROVIDER: [
      'PROVIDER_SUBMITTED',
      'REJECTED',
    ],

    PROVIDER_SUBMITTED: [
      'PROVIDER_PENDING',
      'APPROVED',
      'REJECTED',
    ],

    PROVIDER_PENDING: [
      'APPROVED',
      'REJECTED',
    ],

    APPROVED: [
      'SUSPENDED',
    ],

    REJECTED: [
      'INTERNAL_REVIEW',
    ],

    SUSPENDED: [
      'APPROVED',
    ],
  };

  const allowed =
    allowedTransitions[
      validation.status
    ];

  if (
    !allowed.includes(
      status,
    )
  ) {
    throw new BadRequestException(
      `Invalid sender validation transition: ${validation.status} -> ${status}`,
    );
  }

  const now =
    new Date();

  return this.prisma.$transaction(
    async (tx) => {
      const updatedValidation =
        await tx.senderValidation.update({
          where: {
            id:
              validation.id,
          },

          data: {
            status,

            providerReference:
              dto.providerReference
                ?.trim() ||
              undefined,

            reviewNotes:
              dto.reviewNotes
                ?.trim() ||
              undefined,

            submittedToProviderAt:
              status ===
              'PROVIDER_SUBMITTED'
                ? now
                : undefined,

            completedAt:
              status ===
                'APPROVED' ||
              status ===
                'REJECTED'
                ? now
                : status ===
                    'INTERNAL_REVIEW'
                  ? null
                  : undefined,
          },
        });

      if (
        status ===
        'APPROVED'
      ) {
        await tx.senderRegistration.update({
          where: {
            id:
              senderRegistrationId,
          },

          data: {
            status:
              'APPROVED',

            approvedAt:
              now,

            rejectedAt:
              null,

            providerReference:
              dto.providerReference
                ?.trim() ||
              undefined,
          },
        });
      }

      if (
        status ===
        'REJECTED'
      ) {
        await tx.senderRegistration.update({
          where: {
            id:
              senderRegistrationId,
          },

          data: {
            status:
              'REJECTED',

            rejectedAt:
              now,

            rejectionReason:
              dto.reviewNotes
                ?.trim() ||
              'Sender registration rejected during validation.',
          },
        });
      }

      if (
        status ===
        'SUSPENDED'
      ) {
        await tx.senderRegistration.update({
          where: {
            id:
              senderRegistrationId,
          },

          data: {
            status:
              'SUSPENDED',
          },
        });
      }

      return updatedValidation;
    },
  );
}

async addDocument(
  senderRegistrationId: string,

  dto: {
    documentType: string;
    fileName: string;
    fileUrl: string;
  },
) {
  const registration =
    await this.prisma.senderRegistration.findUnique({
      where: {
        id:
          senderRegistrationId,
      },

      select: {
        id: true,
      },
    });

  if (!registration) {
    throw new NotFoundException(
      'Sender registration not found',
    );
  }

  return this.prisma.senderDocument.create({
    data: {
      senderRegistrationId,

      documentType:
        dto.documentType.trim(),

      fileName:
        dto.fileName.trim(),

      fileUrl:
        dto.fileUrl.trim(),

      status:
        'PENDING',
    },
  });
}

async updateDocumentStatus(
  senderRegistrationId: string,
  documentId: string,

  dto: {
    status:
      | 'PENDING'
      | 'ACCEPTED'
      | 'REJECTED';

    rejectionReason?: string;
  },
) {
  const document =
    await this.prisma.senderDocument.findFirst({
      where: {
        id:
          documentId,

        senderRegistrationId,
      },
    });

  if (!document) {
    throw new NotFoundException(
      'Sender document not found',
    );
  }

  if (
    dto.status ===
      'REJECTED' &&
    !dto.rejectionReason
      ?.trim()
  ) {
    throw new BadRequestException(
      'rejectionReason is required when rejecting a sender document',
    );
  }

  return this.prisma.senderDocument.update({
    where: {
      id:
        document.id,
    },

    data: {
      status:
        dto.status,

      rejectionReason:
        dto.status ===
        'REJECTED'
          ? dto.rejectionReason
              ?.trim()
          : null,
    },
  });
}
}
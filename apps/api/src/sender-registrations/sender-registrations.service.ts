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
    actorUserId: string,
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

    return this.prisma.$transaction(
  async (tx) => {
    const registration =
      await tx.senderRegistration.create({
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
          estimatedMonthlyVolume: true,
          rejectionReason: true,
          submittedAt: true,
          approvedAt: true,
          rejectedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    await tx.senderAuditEvent.create({
      data: {
        senderRegistrationId:
          registration.id,

        actorUserId,

        action:
          'REGISTRATION_CREATED',

        toStatus:
          'DRAFT',

        provider:
          'infobip',
      },
    });

    return registration;
  },
);
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

      include: {
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

        auditEvents: {
  orderBy: {
    createdAt: 'desc',
  },

  include: {
    actorUser: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
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
  actorUserId: string,
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
  actorUserId: string,
) {
  const submittedAt =
    new Date();

  return this.prisma.$transaction(
    async (tx) => {
      const registration =
        await tx.senderRegistration.findFirst({
          where: {
            id,
            businessId,
          },

          include: {
            business: {
              include: {
                wallet: true,
              },
            },
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

      let wallet =
        registration.business.wallet;

      if (!wallet) {
        wallet =
          await tx.wallet.create({
            data: {
              businessId,

              currency:
                registration.business
                  .billingCurrency,

              balance: 0,
            },
          });
      }

      const pricing =
        await tx.senderRegistrationPricing.findFirst({
          where: {
            provider:
              registration.provider,

            countryCode:
              registration.countryCode,

            channel:
              registration.channel,

            senderType:
              registration.senderType,

            currency:
              wallet.currency,

            active:
              true,

            effectiveFrom: {
              lte:
                submittedAt,
            },

            OR: [
              {
                effectiveTo:
                  null,
              },
              {
                effectiveTo: {
                  gt:
                    submittedAt,
                },
              },
            ],
          },

          orderBy: {
            effectiveFrom:
              'desc',
          },
        });

      if (!pricing) {
        throw new BadRequestException(
          `Sender registration pricing is not configured for ${registration.provider}/${registration.countryCode}/${registration.channel}/${registration.senderType} in ${wallet.currency}.`,
        );
      }

      const existingFee =
        await tx.walletTransaction.findUnique({
          where: {
            senderRegistrationId_type: {
              senderRegistrationId:
                id,

              type:
                'SENDER_REGISTRATION_FEE',
            },
          },
        });

      if (!existingFee) {
        const balanceBefore =
          wallet.balance;

        const fee =
          pricing.retailPrice;

        const debit =
          await tx.wallet.updateMany({
            where: {
              id:
                wallet.id,

              balance: {
                gte:
                  fee,
              },
            },

            data: {
              balance: {
                decrement:
                  fee,
              },
            },
          });

        if (
          debit.count !==
          1
        ) {
          throw new BadRequestException(
            `Insufficient wallet balance. Sender registration requires ${wallet.currency} ${fee.toString()}.`,
          );
        }

        const updatedWallet =
          await tx.wallet.findUniqueOrThrow({
            where: {
              id:
                wallet.id,
            },
          });

        await tx.walletTransaction.create({
          data: {
            walletId:
              wallet.id,

            senderRegistrationId:
              id,

            performedByUserId:
              actorUserId,

            type:
              'SENDER_REGISTRATION_FEE',

            status:
              'COMPLETED',

            amount:
              fee.negated(),

            currency:
              wallet.currency,

            balanceBefore,

            balanceAfter:
              updatedWallet.balance,

            reference:
              `sender-registration:${id}`,

            description:
              `Sender registration fee for ${registration.senderValue}`,
          },
        });
      }

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

      await tx.senderAuditEvent.create({
        data: {
          senderRegistrationId:
            id,

          actorUserId,

          action:
            'REGISTRATION_SUBMITTED',

          fromStatus:
            'DRAFT',

          toStatus:
            'SUBMITTED',

          provider:
            registration.provider,
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
  actorUserId: string,
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

  const auditActionByStatus = {
  INTERNAL_REVIEW:
    validation.status ===
    'DOCUMENTS_REQUIRED'
      ? 'REVIEW_RESUMED'
      : 'VALIDATION_STARTED',

  DOCUMENTS_REQUIRED:
    'DOCUMENTS_REQUESTED',

  READY_FOR_PROVIDER:
    'READY_FOR_PROVIDER',

  PROVIDER_SUBMITTED:
    'PROVIDER_SUBMITTED',

  PROVIDER_PENDING:
    'PROVIDER_PENDING',

  APPROVED:
    validation.status ===
    'SUSPENDED'
      ? 'RESTORED'
      : 'APPROVED',

  REJECTED:
    'REJECTED',

  SUSPENDED:
    'SUSPENDED',

  PENDING:
    'VALIDATION_STARTED',
} as const;  

  if (
  status ===
  'READY_FOR_PROVIDER'
) {
  const requirements =
    await this.prisma.senderRequirement.findMany({
      where: {
        active: true,

        provider:
          validation.provider,

        countryCode:
          validation.countryCode,

        documentType: {
          not: null,
        },

        required: true,
      },

      select: {
        documentType: true,
        name: true,
      },
    });

  const documents =
    await this.prisma.senderDocument.findMany({
      where: {
        senderRegistrationId,
        status:
          'ACCEPTED',
      },

      select: {
        documentType: true,
      },
    });

  const acceptedDocumentTypes =
    new Set(
      documents.map(
        (document) =>
          document.documentType,
      ),
    );

  const missingRequirements =
    requirements.filter(
      (requirement) =>
        requirement.documentType &&
        !acceptedDocumentTypes.has(
          requirement.documentType,
        ),
    );

  if (
    missingRequirements.length >
    0
  ) {
    throw new BadRequestException(
      `Required documents are missing or not accepted: ${missingRequirements
        .map(
          (requirement) =>
            requirement.name,
        )
        .join(', ')}`,
    );
  }
}  

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

  reviewerUserId:
    actorUserId,

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

      await tx.senderAuditEvent.create({
  data: {
    senderRegistrationId,

    actorUserId,

    action:
      auditActionByStatus[
        status
      ],

    fromStatus:
      validation.status,

    toStatus:
      status,

    provider:
      validation.provider,

    providerReference:
      dto.providerReference
        ?.trim() ||
      validation.providerReference ||
      undefined,

    note:
      dto.reviewNotes
        ?.trim() ||
      undefined,
  },
});

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
  actorUserId: string,
) {
  const documentType =
    await this.assertValidDocumentType(
      senderRegistrationId,
      dto.documentType,
    );

  await this.assertDocumentUploadAllowed(
  senderRegistrationId,
  documentType,
);  

  return this.prisma.$transaction(
  async (tx) => {
    const document =
      await tx.senderDocument.create({
        data: {
          senderRegistrationId,
          documentType,
          fileName:
            dto.fileName.trim(),
          fileUrl:
            dto.fileUrl.trim(),
          status:
            'PENDING',
        },
      });

    await tx.senderAuditEvent.create({
      data: {
        senderRegistrationId,
        actorUserId,

        action:
          'DOCUMENT_UPLOADED',

        documentId:
          document.id,

        documentType,

        toStatus:
          'PENDING',
      },
    });

    return document;
  },
);
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
  actorUserId: string,
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

  return this.prisma.$transaction(
  async (tx) => {
    const updated =
      await tx.senderDocument.update({
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

    await tx.senderAuditEvent.create({
      data: {
        senderRegistrationId,
        actorUserId,

        action:
          dto.status ===
            'ACCEPTED'
            ? 'DOCUMENT_ACCEPTED'
            : dto.status ===
                'REJECTED'
              ? 'DOCUMENT_REJECTED'
              : 'DOCUMENT_UPLOADED',

        documentId:
          document.id,

        documentType:
          document.documentType,

        fromStatus:
          document.status,

        toStatus:
          dto.status,

        note:
          dto.status ===
            'REJECTED'
            ? dto.rejectionReason
                ?.trim()
            : undefined,
      },
    });

    return updated;
  },
);
}

async addDocumentForBusiness(
  businessId: string,
  senderRegistrationId: string,

  dto: {
    documentType: string;
    fileName: string;
    fileUrl: string;
  },
  actorUserId: string,
) {
  const registration =
    await this.prisma.senderRegistration.findFirst({
      where: {
        id: senderRegistrationId,
        businessId,
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

  const validation =
  await this.prisma.senderValidation.findFirst({
    where: {
      senderRegistrationId,
    },

    orderBy: {
      createdAt:
        'desc',
    },

    select: {
      status: true,
    },
  });

if (
  !validation ||
  validation.status !==
    'DOCUMENTS_REQUIRED'
) {
  throw new BadRequestException(
    'Documents can only be uploaded when additional compliance documents are required',
  );
}

  const documentType =
  await this.assertValidDocumentType(
    senderRegistrationId,
    dto.documentType,
  );

  await this.assertDocumentUploadAllowed(
  senderRegistrationId,
  documentType,
);

  return this.prisma.$transaction(
  async (tx) => {
    const document =
      await tx.senderDocument.create({
        data: {
          senderRegistrationId,
          documentType,
          fileName:
            dto.fileName.trim(),
          fileUrl:
            dto.fileUrl.trim(),
          status:
            'PENDING',
        },
      });

    await tx.senderAuditEvent.create({
      data: {
        senderRegistrationId,
        actorUserId,

        action:
          'DOCUMENT_UPLOADED',

        documentId:
          document.id,

        documentType,

        toStatus:
          'PENDING',
      },
    });

    return document;
  },
);
}

private async assertValidDocumentType(
  senderRegistrationId: string,
  documentType: string,
) {
  const registration =
    await this.prisma.senderRegistration.findUnique({
      where: {
        id: senderRegistrationId,
      },

      select: {
        id: true,
        provider: true,
        countryCode: true,
        channel: true,
        senderType: true,
      },
    });

  if (!registration) {
    throw new NotFoundException(
      'Sender registration not found',
    );
  }

  const normalizedDocumentType =
    documentType.trim();

  const requirement =
    await this.prisma.senderRequirement.findFirst({
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

        documentType:
          normalizedDocumentType,
      },

      select: {
        id: true,
      },
    });

  if (!requirement) {
    throw new BadRequestException(
      'Document type is not valid for this sender registration',
    );
  }

  return normalizedDocumentType;
}

private async assertDocumentUploadAllowed(
  senderRegistrationId: string,
  documentType: string,
) {
  const existing =
    await this.prisma.senderDocument.findFirst({
      where: {
        senderRegistrationId,
        documentType,

        status: {
          in: [
            'PENDING',
            'ACCEPTED',
          ],
        },
      },

      orderBy: {
        createdAt:
          'desc',
      },

      select: {
        status: true,
      },
    });

  if (!existing) {
    return;
  }

  if (
    existing.status ===
    'ACCEPTED'
  ) {
    throw new BadRequestException(
      'This document requirement has already been accepted',
    );
  }

  throw new BadRequestException(
    'A document of this type is already awaiting review',
  );
}
}
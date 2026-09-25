import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateSenderRegistrationDto } from './dto/create-sender-registration.dto.js';

@Injectable()
export class SenderRegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
  businessId: string,
  dto: CreateSenderRegistrationDto,
) {
    const business =
  await this.prisma.business.findUnique({
    where: {
      id: businessId,
    },
  });

    if (!business) {
      throw new BadRequestException('Business does not exist');
    }

    return this.prisma.senderRegistration.create({
      data: {
        businessId,
        channel: dto.channel,
        senderType: dto.senderType,
        senderValue: dto.senderValue,
        countryCode: dto.countryCode.toUpperCase(),
        destinationCountry: dto.destinationCountry?.toUpperCase(),
        useCase: dto.useCase,
        estimatedMonthlyVolume: dto.estimatedMonthlyVolume,
        provider: 'infobip',
        status: 'DRAFT',
      },
      include: {
        business: true,
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
      createdAt: 'desc',
    },
  });
}

  async findOne(id: string) {
    const registration = await this.prisma.senderRegistration.findUnique({
      where: { id },
      include: {
        business: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Sender registration not found');
    }

    return registration;
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
    const registration = await this.findOne(id);
    const status = dto.status;

    const allowedTransitions: Record<
      typeof registration.status,
      Array<typeof registration.status>
    > = {
      DRAFT: ['SUBMITTED'],
      SUBMITTED: ['PENDING'],
      PENDING: ['APPROVED', 'REJECTED'],
      APPROVED: ['SUSPENDED'],
      REJECTED: ['DRAFT'],
      SUSPENDED: ['APPROVED'],
    };

    const allowed = allowedTransitions[registration.status];

    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Invalid sender status transition: ${registration.status} -> ${status}`,
      );
    }

    if (status === 'REJECTED' && !dto.rejectionReason) {
      throw new BadRequestException(
        'rejectionReason is required when rejecting a sender registration',
      );
    }

    const now = new Date();

    return this.prisma.senderRegistration.update({
      where: { id },
      data: {
        status,

        providerReference: dto.providerReference ?? undefined,

        rejectionReason:
          status === 'REJECTED'
            ? dto.rejectionReason
            : status === 'DRAFT'
              ? null
              : undefined,

        submittedAt:
          status === 'SUBMITTED' ? now : status === 'DRAFT' ? null : undefined,

        approvedAt:
          status === 'APPROVED' ? now : status === 'DRAFT' ? null : undefined,

        rejectedAt:
          status === 'REJECTED' ? now : status === 'DRAFT' ? null : undefined,
      },
      include: {
        business: true,
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
    });

  if (!registration) {
    throw new NotFoundException(
      'Sender registration not found',
    );
  }

  return registration;
}
}



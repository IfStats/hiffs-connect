import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  createHash,
  randomInt,
} from 'node:crypto';

import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';

import { InvitationStatus } from '@prisma/client';

import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';

import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { SignupDto } from './dto/signup.dto.js';

import { PrismaService } from '../prisma.service.js';
import { VerifyCredentialsDto } from './dto/verify-credentials.dto.js';

import { EmailService } from '../email/email.service.js';

import { SendPhoneVerificationDto } from './dto/send-phone-verification.dto.js';
import { VerifyPhoneDto } from './dto/verify-phone.dto.js';

import { PhoneVerificationService } from '../phone-verification/phone-verification.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly phoneVerificationService: PhoneVerificationService,
  ) {}

  async verifyCredentials(dto: VerifyCredentialsDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },

      include: {
        memberships: {
          where: {
            active: true,

            business: {
              status: 'ACTIVE',
            },
          },

          include: {
            business: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account access is unavailable');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerified) {
  throw new UnauthorizedException({
    message:
      'Email verification required',
    code:
      'EMAIL_NOT_VERIFIED',
  });
}

const phoneVerificationRequired =
  process.env
    .PHONE_VERIFICATION_REQUIRED ===
  'true';

if (
  phoneVerificationRequired &&
  !user.phoneVerified
) {
  throw new UnauthorizedException({
    message:
      'Phone verification required',
    code:
      'PHONE_NOT_VERIFIED',
  });
}

    if (user.memberships.length === 0 && !user.platformRole) {
      throw new UnauthorizedException('User has no active workspace');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      platformRole: user.platformRole,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      platformRole: user.platformRole,

      memberships: user.memberships.map((membership) => ({
        id: membership.id,
        businessId: membership.businessId,
        businessName: membership.business.name,
        role: membership.role,
      })),

      accessToken,
    };
  }

  async signup(dto: SignupDto) {
    const email = dto.email.trim().toLowerCase();
    const countryCode = dto.countryCode.trim().toUpperCase();
    const businessName = dto.businessName.trim();

    const phone =dto.phone.trim();

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException('An account already exists with this email');
    }

   
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const existingPhone =
  await this.prisma.user.findUnique({
    where: {
      phone,
    },
  });

if (existingPhone) {
  throw new ConflictException(
    'An account already exists with this phone number',
  );
}

    const result = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            phone,
            name: dto.name.trim(),
            passwordHash,
          },
        });

        const business = await tx.business.create({
          data: {
            name: businessName,
            countryCode,
            website: dto.website?.trim() || null,
            email: dto.businessEmail?.trim().toLowerCase() || email,
            phone,
          },
        });

        const wallet = await tx.wallet.create({
          data: {
            businessId: business.id,
            currency: 'USD',
            balance: new Prisma.Decimal(0),
          },
        });

        const membership = await tx.businessMembership.create({
          data: {
            userId: user.id,
            businessId: business.id,
            role: 'OWNER',
            active: true,
          },
        });

        return {
          user,
          business,
          wallet,
          membership,
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    const verification =
  await this.createEmailVerificationCode(
    result.user.id,
    result.user.email,
  );

await this.emailService.sendVerificationEmail({
  to: result.user.email,
  name: result.user.name,
  code: verification.code,
});
    return {

      verification:
  process.env.NODE_ENV !== 'production'
    ? {
        code: verification.code,
        expiresAt:
          verification.expiresAt,
      }
    : undefined,

      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        status: result.user.status,
        platformRole: result.user.platformRole,
        emailVerified: result.user.emailVerified,
      },

      business: {
        id: result.business.id,
        name: result.business.name,
        countryCode: result.business.countryCode,
        status: result.business.status,
      },

      membership: {
        id: result.membership.id,
        businessId: result.membership.businessId,
        role: result.membership.role,
        active: result.membership.active,
      },

      wallet: {
        id: result.wallet.id,
        currency: result.wallet.currency,
        balance: result.wallet.balance,
      },

      };
  }

  

private hashVerificationCode(
  email: string,
  code: string,
) {
  return createHash('sha256')
    .update(
      `${email.trim().toLowerCase()}:${code}`,
    )
    .digest('hex');
}

private async createEmailVerificationCode(
  userId: string,
  email: string,
) {
  const code =
    randomInt(
      100000,
      1000000,
    ).toString();

  const tokenHash =
    this.hashVerificationCode(
      email,
      code,
    );

  const expiresAt =
    new Date(
      Date.now() +
        10 * 60 * 1000,
    );

  /*
   * A newly generated code invalidates every
   * previous verification code for this user.
   */
  await this.prisma.emailVerificationToken.deleteMany({
    where: {
      userId,
    },
  });

  await this.prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    code,
    expiresAt,
  };
}

async verifyEmail(
  dto: VerifyEmailDto,
) {
  const email =
    dto.email
      .trim()
      .toLowerCase();

  const user =
    await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

  /*
   * Keep the response generic so this endpoint
   * does not disclose whether an email exists.
   */
  if (!user) {
    throw new BadRequestException(
      'Invalid verification code',
    );
  }

  if (user.emailVerified) {
    return {
      verified: true,
      alreadyVerified: true,
    };
  }

  const tokenHash =
    this.hashVerificationCode(
      email,
      dto.code,
    );

  const verification =
    await this.prisma.emailVerificationToken.findUnique({
      where: {
        tokenHash,
      },
    });

  if (
    !verification ||
    verification.userId !== user.id ||
    verification.usedAt
  ) {
    throw new BadRequestException(
      'Invalid verification code',
    );
  }

  if (
    verification.expiresAt.getTime() <=
    Date.now()
  ) {
    throw new BadRequestException(
      'Verification code has expired',
    );
  }

  const verifiedAt =
    new Date();

  await this.prisma.$transaction([
    this.prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        emailVerified:
          verifiedAt,
      },
    }),

    this.prisma.emailVerificationToken.update({
      where: {
        id: verification.id,
      },

      data: {
        usedAt:
          verifiedAt,
      },
    }),
  ]);

  return {
    verified: true,
    emailVerified:
      verifiedAt,
  };
}

async resendVerification(
  dto: ResendVerificationDto,
) {
  const email =
    dto.email
      .trim()
      .toLowerCase();

  const user =
    await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

  /*
   * Always return the same public response
   * for unknown or already verified emails.
   */
  if (
    !user ||
    user.emailVerified
  ) {
    return {
      accepted: true,
    };
  }

  const verification =
    await this.createEmailVerificationCode(
      user.id,
      user.email,
    );

  await this.emailService.sendVerificationEmail({
    to: user.email,
    name: user.name,
    code: verification.code,
  });

  if (
    process.env.NODE_ENV !==
    'production'
  ) {
    return {
      accepted: true,
      verificationCode:
        verification.code,
      expiresAt:
        verification.expiresAt,
    };
  }

  return {
    accepted: true,
  };
}

  async acceptInvitation(userId: string, dto: AcceptInvitationDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');

    const invitation = await this.prisma.businessInvitation.findUnique({
      where: {
        tokenHash,
      },

      include: {
        business: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new BadRequestException('Invitation is invalid');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer active');
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      await this.prisma.businessInvitation.update({
        where: {
          id: invitation.id,
        },

        data: {
          status: InvitationStatus.EXPIRED,
        },
      });

      throw new BadRequestException('Invitation has expired');
    }

    if (invitation.business.status !== 'ACTIVE') {
      throw new BadRequestException('Business account is not active');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account access is unavailable');
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException(
        'Invitation email does not match authenticated user',
      );
    }

    const existingMembership = await this.prisma.businessMembership.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId: invitation.businessId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this business');
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const membership = await tx.businessMembership.create({
          data: {
            userId,
            businessId: invitation.businessId,
            role: invitation.role,
            active: true,
          },

          select: {
            id: true,
            businessId: true,
            role: true,
            active: true,
            createdAt: true,
          },
        });

        await tx.businessInvitation.update({
          where: {
            id: invitation.id,
          },

          data: {
            status: InvitationStatus.ACCEPTED,

            acceptedByUserId: userId,

            acceptedAt: new Date(),
          },
        });

        return membership;
      },

      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    return {
      business: {
        id: invitation.business.id,
        name: invitation.business.name,
      },

      membership: result,
    };
  }

  async sendPhoneVerification(
  dto: SendPhoneVerificationDto,
) {
  const email =
    dto.email.trim().toLowerCase();

  const user =
    await this.prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id: true,
        email: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

  /*
   * Do not disclose whether an account exists.
   * SMS verification is only available after
   * email ownership has already been confirmed.
   */
  if (
    !user ||
    !user.emailVerified ||
    !user.phone ||
    user.phoneVerified
  ) {
    return {
      accepted: true,
    };
  }

  const latestVerification =
    await this.prisma.phoneVerification.findFirst({
      where: {
        userId: user.id,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

  /*
   * Server-side resend cooldown.
   */
  if (latestVerification) {
    const elapsed =
      Date.now() -
      latestVerification.createdAt.getTime();

    if (elapsed < 60_000) {
      return {
        accepted: true,
        cooldownSeconds:
          Math.ceil(
            (60_000 - elapsed) /
              1000,
          ),
      };
    }
  }

  const providerResult =
    await this.phoneVerificationService.sendPin(
      user.phone,
    );

  const expiresAt =
    new Date(
      Date.now() +
        5 * 60 * 1000,
    );

  await this.prisma.phoneVerification.create({
    data: {
      userId: user.id,
      phone: user.phone,

      provider:
        providerResult.provider,

      providerPinId:
        providerResult.pinId,

      expiresAt,
    },
  });

  return {
    accepted: true,
    cooldownSeconds: 60,
  };
}

async verifyPhone(
  dto: VerifyPhoneDto,
) {
  const email =
    dto.email.trim().toLowerCase();

  const user =
    await this.prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

  if (
    !user ||
    !user.emailVerified ||
    !user.phone
  ) {
    throw new BadRequestException(
      'Invalid phone verification request',
    );
  }

  if (user.phoneVerified) {
    return {
      verified: true,
      alreadyVerified: true,
    };
  }

  const verification =
    await this.prisma.phoneVerification.findFirst({
      where: {
        userId: user.id,
        phone: user.phone,
        verifiedAt: null,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

  if (!verification) {
    throw new BadRequestException(
      'Request a new verification code',
    );
  }

  if (
    verification.expiresAt.getTime() <=
    Date.now()
  ) {
    throw new BadRequestException(
      'Verification code has expired',
    );
  }

  const result =
    await this.phoneVerificationService.verifyPin(
      verification.providerPinId,
      dto.code,
    );

  if (!result.verified) {
    throw new BadRequestException(
      'Invalid verification code',
    );
  }

  const verifiedAt =
    new Date();

  await this.prisma.$transaction([
    this.prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        phoneVerified:
          verifiedAt,
      },
    }),

    this.prisma.phoneVerification.update({
      where: {
        id: verification.id,
      },

      data: {
        verifiedAt,
      },
    }),
  ]);

  return {
    verified: true,
    phoneVerified:
      verifiedAt,
  };
}
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';

import {
  AccountStatus,
  PlatformRole,
} from '@prisma/client';

import { UpdateAccountStatusDto } from './dto/update-account-status.dto.js';
import { UpdatePlatformRoleDto } from './dto/update-platform-role.dto.js';

import { PrismaService } from '../prisma.service.js';
import { WalletOperationDto } from './dto/wallet-operation.dto.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listBusinesses() {
    return this.prisma.business.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,
        name: true,
        countryCode: true,
        website: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,

        wallet: {
          select: {
            id: true,
            currency: true,
            balance: true,
          },
        },

        _count: {
          select: {
            memberships: true,
            messages: true,
            senderIdentities: true,
            apiKeys: true,
          },
        },
      },
    });
  }

  async getBusiness(id: string) {
    const business = await this.prisma.business.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,
        countryCode: true,
        website: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,

        wallet: {
          select: {
            id: true,
            currency: true,
            balance: true,
            updatedAt: true,
          },
        },

        memberships: {
          where: {
            active: true,
          },

          select: {
            id: true,
            role: true,
            active: true,
            createdAt: true,

            user: {
              select: {
                id: true,
                email: true,
                name: true,
                platformRole: true,
              },
            },
          },
        },

        _count: {
          select: {
            messages: true,
            senderIdentities: true,
            apiKeys: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  async listUsers() {
  return this.prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },

    select: {
      id: true,
      email: true,
      status: true,
      name: true,
      platformRole: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,

      memberships: {
        select: {
          id: true,
          role: true,
          active: true,
          businessId: true,

          business: {
            select: {
              id: true,
              name: true,
              countryCode: true,
            },
          },
        },
      },
    },
  });
}

async getUser(id: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      platformRole: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,

      memberships: {
        select: {
          id: true,
          role: true,
          active: true,
          businessId: true,
          createdAt: true,
          updatedAt: true,

          business: {
            select: {
              id: true,
              name: true,
              countryCode: true,
              email: true,
              website: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}

  async getWalletTransactions(businessId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: {
        businessId,
      },
    });

    if (!wallet) {
      throw new NotFoundException('Business wallet not found');
    }

    return this.prisma.walletTransaction.findMany({
      where: {
        walletId: wallet.id,
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 100,

      include: {
        performedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
            platformRole: true,
          },
        },
      },
    });
  }

  async creditWallet(
    businessId: string,
    performedByUserId: string,
    dto: WalletOperationDto,
  ) {
    const amount = new Prisma.Decimal(dto.amount);

    return this.prisma.$transaction(
      async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: {
            businessId,
          },
        });

        if (!wallet) {
          throw new NotFoundException('Business wallet not found');
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore.add(amount);

        const updatedWallet = await tx.wallet.update({
          where: {
            id: wallet.id,
          },

          data: {
            balance: balanceAfter,
          },
        });

        const transaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: WalletTransactionType.ADJUSTMENT,
            status: WalletTransactionStatus.COMPLETED,

            amount,
            currency: wallet.currency,

            balanceBefore,
            balanceAfter,

            reference: dto.reference,
            description: dto.reason,
            performedByUserId,
          },
        });

        return {
          businessId,
          walletId: updatedWallet.id,
          currency: updatedWallet.currency,
          balanceBefore,
          creditedAmount: amount,
          balanceAfter: updatedWallet.balance,
          transaction,
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );
  }

  async debitWallet(
    businessId: string,
    performedByUserId: string,
    dto: WalletOperationDto,
  ) {
    const amount = new Prisma.Decimal(dto.amount);

    return this.prisma.$transaction(
      async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: {
            businessId,
          },
        });

        if (!wallet) {
          throw new NotFoundException('Business wallet not found');
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore.sub(amount);

        if (balanceAfter.lt(0)) {
          throw new BadRequestException(
            'Debit would produce a negative wallet balance',
          );
        }

        const updatedWallet = await tx.wallet.update({
          where: {
            id: wallet.id,
          },

          data: {
            balance: balanceAfter,
          },
        });

        const transaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,

            type: WalletTransactionType.ADJUSTMENT,
            status: WalletTransactionStatus.COMPLETED,

            amount: amount.negated(),
            currency: wallet.currency,

            balanceBefore,
            balanceAfter,

            reference: dto.reference,
            description: dto.reason,
            performedByUserId,
          },
        });

        return {
          businessId,
          walletId: updatedWallet.id,
          currency: updatedWallet.currency,
          balanceBefore,
          debitedAmount: amount,
          balanceAfter: updatedWallet.balance,
          transaction,
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );
  }

  async refundWallet(
    businessId: string,
    performedByUserId: string,
    dto: WalletOperationDto,
  ) {
    const amount = new Prisma.Decimal(dto.amount);

    return this.prisma.$transaction(
      async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: {
            businessId,
          },
        });

        if (!wallet) {
          throw new NotFoundException('Business wallet not found');
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore.add(amount);

        const updatedWallet = await tx.wallet.update({
          where: {
            id: wallet.id,
          },

          data: {
            balance: balanceAfter,
          },
        });

        const transaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,

            type: WalletTransactionType.REFUND,
            status: WalletTransactionStatus.COMPLETED,

            amount,
            currency: wallet.currency,

            balanceBefore,
            balanceAfter,

            reference: dto.reference,
            description: dto.reason,
            performedByUserId,
          },
        });

        return {
          businessId,
          walletId: updatedWallet.id,
          currency: updatedWallet.currency,
          balanceBefore,
          refundedAmount: amount,
          balanceAfter: updatedWallet.balance,
          transaction,
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );
  }

  async updateUserStatus(
  targetUserId: string,
  actorUserId: string,
  dto: UpdateAccountStatusDto,
) {
  const target = await this.prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
  });

  if (!target) {
    throw new NotFoundException('User not found');
  }

  if (
    targetUserId === actorUserId &&
    dto.status !== AccountStatus.ACTIVE
  ) {
    throw new BadRequestException(
      'You cannot suspend or restrict your own platform account',
    );
  }

  if (
    target.platformRole === PlatformRole.SUPER_ADMIN &&
    dto.status !== AccountStatus.ACTIVE
  ) {
    const activeSuperAdmins = await this.prisma.user.count({
      where: {
        platformRole: PlatformRole.SUPER_ADMIN,
        status: AccountStatus.ACTIVE,
      },
    });

    if (activeSuperAdmins <= 1) {
      throw new BadRequestException(
        'Cannot disable the last active SUPER_ADMIN',
      );
    }
  }

  return this.prisma.user.update({
    where: {
      id: targetUserId,
    },

    data: {
      status: dto.status,
    },

    select: {
      id: true,
      email: true,
      status: true,
      platformRole: true,
      updatedAt: true,
    },
  });
}

async updateBusinessStatus(
  businessId: string,
  dto: UpdateAccountStatusDto,
) {
  const business = await this.prisma.business.findUnique({
    where: {
      id: businessId,
    },
  });

  if (!business) {
    throw new NotFoundException('Business not found');
  }

  return this.prisma.business.update({
    where: {
      id: businessId,
    },

    data: {
      status: dto.status,
    },

    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
    },
  });
}

async updatePlatformRole(
  targetUserId: string,
  actorUserId: string,
  dto: UpdatePlatformRoleDto,
) {
  const target = await this.prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
  });

  if (!target) {
    throw new NotFoundException('User not found');
  }

  if (
    targetUserId === actorUserId &&
    dto.platformRole !== PlatformRole.SUPER_ADMIN
  ) {
    throw new BadRequestException(
      'You cannot remove your own SUPER_ADMIN role',
    );
  }

  if (
    target.platformRole === PlatformRole.SUPER_ADMIN &&
    dto.platformRole !== PlatformRole.SUPER_ADMIN
  ) {
    const activeSuperAdmins = await this.prisma.user.count({
      where: {
        platformRole: PlatformRole.SUPER_ADMIN,
        status: AccountStatus.ACTIVE,
      },
    });

    if (activeSuperAdmins <= 1) {
      throw new BadRequestException(
        'Cannot demote the last active SUPER_ADMIN',
      );
    }
  }

  return this.prisma.user.update({
    where: {
      id: targetUserId,
    },

    data: {
      platformRole: dto.platformRole,
    },

    select: {
      id: true,
      email: true,
      status: true,
      platformRole: true,
      updatedAt: true,
    },
  });
}
}
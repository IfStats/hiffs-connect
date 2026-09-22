import { Prisma } from '@prisma/client';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '../prisma.service.js';

import { SendSmsDto } from './dto/send-sms.dto.js';
import { DeliveryWebhookDto } from './dto/delivery-webhook.dto.js';
import { InfobipDeliveryReportDto } from './dto/infobip-delivery-report.dto.js';
import { RouteMobileDeliveryReportDto } from './dto/routemobile-delivery-report.dto.js';

import { InfobipProvider } from './providers/infobip.provider.js';
import { RouteMobileProvider } from './providers/routemobile.provider.js';
import { MessagingProviderError } from './providers/provider-error.js';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(
    MessagingService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly infobipProvider: InfobipProvider,
    private readonly routeMobileProvider: RouteMobileProvider,
  ) {}

  async sendSms(dto: SendSmsDto) {
    const configuredProvider =
      process.env.MESSAGING_PROVIDER ?? 'mock';

    const senderRegistration =
      await this.prisma.senderRegistration.findUnique({
        where: {
          id: dto.senderRegistrationId,
        },
      });

    if (!senderRegistration) {
      throw new BadRequestException(
        'Sender registration not found',
      );
    }

    if (senderRegistration.status !== 'APPROVED') {
      throw new BadRequestException(
        `Sender registration is not approved. Current status: ${senderRegistration.status}`,
      );
    }

    if (senderRegistration.channel !== 'SMS') {
      throw new BadRequestException(
        'Sender registration is not approved for SMS',
      );
    }

    const pricingCountryCode =
      senderRegistration.destinationCountry ??
      senderRegistration.countryCode;

    const now = new Date();

    let routingRule:
      | {
          id: string;
          provider: string;
          priority: number;
        }
      | null = null;

    let commercialProvider: string;

    /*
     * Mock mode still performs real routing and pricing resolution.
     * Only the provider transport itself is mocked.
     */
    if (configuredProvider === 'mock') {
      routingRule =
        await this.prisma.providerRoutingRule.findFirst({
          where: {
            countryCode: pricingCountryCode,
            channel: 'SMS',
            enabled: true,
            network: null,
          },

          orderBy: {
            priority: 'asc',
          },

          select: {
            id: true,
            provider: true,
            priority: true,
          },
        });

      if (!routingRule) {
        throw new BadRequestException(
          `No active SMS routing rule configured for ${pricingCountryCode}`,
        );
      }

      commercialProvider =
        routingRule.provider;
    } else {
      commercialProvider =
        configuredProvider;

      routingRule =
        await this.prisma.providerRoutingRule.findFirst({
          where: {
            countryCode: pricingCountryCode,
            channel: 'SMS',
            provider: commercialProvider,
            enabled: true,
            network: null,
          },

          orderBy: {
            priority: 'asc',
          },

          select: {
            id: true,
            provider: true,
            priority: true,
          },
        });
    }

    const pricing =
      await this.prisma.countryPricing.findFirst({
        where: {
          countryCode: pricingCountryCode,
          channel: 'SMS',
          provider: commercialProvider,
          status: 'ACTIVE',
          network: null,

          effectiveFrom: {
            lte: now,
          },

          OR: [
            {
              effectiveTo: null,
            },
            {
              effectiveTo: {
                gte: now,
              },
            },
          ],
        },

        orderBy: {
          effectiveFrom: 'desc',
        },
      });

    if (!pricing) {
      throw new BadRequestException(
        `No active SMS pricing configured for ${pricingCountryCode} using provider ${commercialProvider}`,
      );
    }

    const wallet =
      await this.prisma.wallet.findUnique({
        where: {
          businessId:
            senderRegistration.businessId,
        },
      });

    if (!wallet) {
      throw new BadRequestException(
        'Business wallet not found',
      );
    }

    if (wallet.currency !== pricing.currency) {
      throw new BadRequestException(
        `Wallet currency ${wallet.currency} does not match message pricing currency ${pricing.currency}`,
      );
    }

    if (
      wallet.balance.lt(
        pricing.retailPrice,
      )
    ) {
      throw new BadRequestException(
        'Insufficient wallet balance',
      );
    }

    const dispatchProvider =
      configuredProvider === 'mock'
        ? 'mock'
        : commercialProvider;

    /*
     * Message creation, customer debit and ledger creation happen
     * together. If any operation fails, none of them are committed.
     */
    const {
      message,
      debitTransaction,
    } = await this.prisma.$transaction(
      async (tx) => {
        const currentWallet =
          await tx.wallet.findUniqueOrThrow({
            where: {
              id: wallet.id,
            },
          });

        if (
          currentWallet.currency !==
          pricing.currency
        ) {
          throw new BadRequestException(
            `Wallet currency ${currentWallet.currency} does not match message pricing currency ${pricing.currency}`,
          );
        }

        if (
          currentWallet.balance.lt(
            pricing.retailPrice,
          )
        ) {
          throw new BadRequestException(
            'Insufficient wallet balance',
          );
        }

        const balanceBefore =
          currentWallet.balance;

        const balanceAfter =
          balanceBefore.minus(
            pricing.retailPrice,
          );

        const createdMessage =
          await tx.message.create({
            data: {
              businessId:
                senderRegistration.businessId,

              senderRegistrationId:
                senderRegistration.id,

              channel:
                'SMS',

              provider:
                commercialProvider,

              sender:
                senderRegistration.senderValue,

              recipient:
                dto.to,

              content:
                dto.text,

              status:
                'QUEUED',

              countryCode:
                senderRegistration.countryCode,

              destinationCountry:
                pricingCountryCode,

              providerCost:
                pricing.providerCost,

              customerPrice:
                pricing.retailPrice,

              currency:
                pricing.currency,
            },
          });

        await tx.wallet.update({
          where: {
            id:
              currentWallet.id,
          },

          data: {
            balance:
              balanceAfter,
          },
        });

        const createdDebitTransaction =
          await tx.walletTransaction.create({
            data: {
              walletId:
                currentWallet.id,

              messageId:
                createdMessage.id,

              type:
                'MESSAGE_DEBIT',

              status:
                'COMPLETED',

              amount:
                pricing.retailPrice,

              currency:
                pricing.currency,

              balanceBefore,

              balanceAfter,

              reference:
                `sms-${createdMessage.id}`,

              description:
                `SMS charge to ${dto.to}`,
            },
          });

        return {
          message:
            createdMessage,

          debitTransaction:
            createdDebitTransaction,
        };
      },
    );

    /*
     * Everything below this point happens after the customer
     * has been charged. Any definitive dispatch failure therefore
     * passes through failMessageAndRefund().
     */
    try {
      const primaryRoutingAttempt =
        await this.prisma.messageRoutingAttempt.create({
          data: {
            messageId:
              message.id,

            routingRuleId:
              routingRule?.id ?? null,

            provider:
              commercialProvider,

            priority:
              routingRule?.priority ?? null,

            attemptNumber:
              1,

            outcome:
              'STARTED',
          },
        });

      let result;

      try {
        result =
          await this.dispatchSms(
            dispatchProvider,
            dto,
            senderRegistration.senderValue,
          );

        await this.prisma.messageRoutingAttempt.update({
          where: {
            id:
              primaryRoutingAttempt.id,
          },

          data: {
            outcome:
              'ACCEPTED',
          },
        });
      } catch (error) {
        await this.prisma.messageRoutingAttempt.update({
          where: {
            id:
              primaryRoutingAttempt.id,
          },

          data: {
            outcome:
              'FAILED',

            retryable:
              error instanceof
              MessagingProviderError
                ? error.retryable
                : false,

            errorCode:
              error instanceof
              MessagingProviderError
                ? error.code
                : undefined,

            errorMessage:
              error instanceof Error
                ? error.message
                : 'Unknown provider error',
          },
        });

        /*
         * Mock mode never performs real failover.
         *
         * Real failover is permitted only for a provider error
         * explicitly marked retryable.
         */
        if (
          configuredProvider === 'mock' ||
          !(
            error instanceof
            MessagingProviderError
          ) ||
          !error.retryable
        ) {
          throw error;
        }

        const fallbackRule =
          await this.prisma.providerRoutingRule.findFirst({
            where: {
              countryCode:
                pricingCountryCode,

              channel:
                'SMS',

              enabled:
                true,

              network:
                null,

              provider: {
                not:
                  commercialProvider,
              },
            },

            orderBy: {
              priority:
                'asc',
            },
          });

        if (!fallbackRule) {
          throw error;
        }

        const fallbackPricing =
          await this.prisma.countryPricing.findFirst({
            where: {
              countryCode:
                pricingCountryCode,

              channel:
                'SMS',

              provider:
                fallbackRule.provider,

              status:
                'ACTIVE',

              network:
                null,

              effectiveFrom: {
                lte: now,
              },

              OR: [
                {
                  effectiveTo:
                    null,
                },
                {
                  effectiveTo: {
                    gte: now,
                  },
                },
              ],
            },

            orderBy: {
              effectiveFrom:
                'desc',
            },
          });

        if (!fallbackPricing) {
          throw error;
        }

        /*
         * The customer's retail charge was established before
         * dispatch. Failover may change Hiffs' provider cost,
         * but must not silently change the customer's price.
         */
        if (
          fallbackPricing.currency !==
          pricing.currency
        ) {
          throw new InternalServerErrorException(
            `Fallback provider pricing currency ${fallbackPricing.currency} does not match original message currency ${pricing.currency}`,
          );
        }

        const fallbackAttempt =
          await this.prisma.messageRoutingAttempt.create({
            data: {
              messageId:
                message.id,

              routingRuleId:
                fallbackRule.id,

              provider:
                fallbackRule.provider,

              priority:
                fallbackRule.priority,

              attemptNumber:
                2,

              outcome:
                'STARTED',
            },
          });

        try {
          result =
            await this.dispatchSms(
              fallbackRule.provider,
              dto,
              senderRegistration.senderValue,
            );

          await this.prisma.messageRoutingAttempt.update({
            where: {
              id:
                fallbackAttempt.id,
            },

            data: {
              outcome:
                'ACCEPTED',
            },
          });

          commercialProvider =
            fallbackRule.provider;

          /*
           * Only actual provider and provider cost change.
           *
           * customerPrice and currency remain the original
           * commercial quote already charged to the wallet.
           */
          await this.prisma.message.update({
            where: {
              id:
                message.id,
            },

            data: {
              provider:
                fallbackRule.provider,

              providerCost:
                fallbackPricing.providerCost,
            },
          });
        } catch (fallbackError) {
          await this.prisma.messageRoutingAttempt.update({
            where: {
              id:
                fallbackAttempt.id,
            },

            data: {
              outcome:
                'FAILED',

              retryable:
                fallbackError instanceof
                MessagingProviderError
                  ? fallbackError.retryable
                  : false,

              errorCode:
                fallbackError instanceof
                MessagingProviderError
                  ? fallbackError.code
                  : undefined,

              errorMessage:
                fallbackError instanceof Error
                  ? fallbackError.message
                  : 'Unknown fallback provider error',
            },
          });

          throw fallbackError;
        }
      }

      return await this.prisma.message.update({
        where: {
          id:
            message.id,
        },

        data: {
          provider:
            commercialProvider,

          providerMessageId:
            result.messageId,

          status:
            'ACCEPTED',

          providerResponse:
            result.raw as Prisma.InputJsonValue,

          failureReason:
            null,
        },
      });
    } catch (error) {
      const failureReason =
        error instanceof Error
          ? error.message
          : 'Unknown messaging provider error';

      try {
        await this.failMessageAndRefund(
          message.id,
          debitTransaction.id,
          failureReason,
        );
      } catch (billingError) {
        this.logger.error(
          `Failed to reconcile wallet after SMS dispatch failure for message ${message.id}`,
          billingError instanceof Error
            ? billingError.stack
            : String(billingError),
        );

        /*
         * Best effort to at least preserve the message failure
         * even if financial reconciliation itself fails.
         */
        try {
          await this.prisma.message.update({
            where: {
              id:
                message.id,
            },

            data: {
              status:
                'FAILED',

              failureReason:
                `${failureReason} | Wallet refund reconciliation failed`,
            },
          });
        } catch (messageUpdateError) {
          this.logger.error(
            `Failed to mark message ${message.id} as FAILED`,
            messageUpdateError instanceof Error
              ? messageUpdateError.stack
              : String(messageUpdateError),
          );
        }
      }

      throw error;
    }
  }

  /**
   * Marks the message as FAILED and reverses its completed
   * MESSAGE_DEBIT in one database transaction.
   *
   * The method is idempotent for an already-reversed debit:
   * calling it again will not credit the wallet twice.
   */
  private async failMessageAndRefund(
    messageId: string,
    debitTransactionId: string,
    failureReason: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const debit =
          await tx.walletTransaction.findUnique({
            where: {
              id:
                debitTransactionId,
            },
          });

        if (!debit) {
          throw new Error(
            `Wallet debit transaction ${debitTransactionId} not found`,
          );
        }

        await tx.message.update({
          where: {
            id:
              messageId,
          },

          data: {
            status:
              'FAILED',

            failureReason,
          },
        });

        /*
         * If the original debit has already been reversed,
         * do not credit the wallet again.
         */
        if (
          debit.status === 'REVERSED'
        ) {
          const existingRefund =
            await tx.walletTransaction.findFirst({
              where: {
                walletId:
                  debit.walletId,

                messageId,

                type:
                  'REFUND',
              },

              orderBy: {
                createdAt:
                  'desc',
              },
            });

          return {
            refunded:
              false,

            reason:
              'Debit already reversed',

            refund:
              existingRefund,
          };
        }

        if (
          debit.type !==
          'MESSAGE_DEBIT'
        ) {
          throw new Error(
            `Wallet transaction ${debit.id} is not a MESSAGE_DEBIT`,
          );
        }

        if (
          debit.status !==
          'COMPLETED'
        ) {
          throw new Error(
            `Wallet debit ${debit.id} cannot be refunded from status ${debit.status}`,
          );
        }

        const existingRefund =
          await tx.walletTransaction.findFirst({
            where: {
              walletId:
                debit.walletId,

              messageId,

              type:
                'REFUND',

              status:
                'COMPLETED',
            },
          });

        if (existingRefund) {
          await tx.walletTransaction.update({
            where: {
              id:
                debit.id,
            },

            data: {
              status:
                'REVERSED',
            },
          });

          return {
            refunded:
              false,

            reason:
              'Refund already exists',

            refund:
              existingRefund,
          };
        }

        const currentWallet =
          await tx.wallet.findUniqueOrThrow({
            where: {
              id:
                debit.walletId,
            },
          });

        if (
          currentWallet.currency !==
          debit.currency
        ) {
          throw new Error(
            `Wallet currency ${currentWallet.currency} does not match debit currency ${debit.currency}`,
          );
        }

        const balanceBefore =
          currentWallet.balance;

        const balanceAfter =
          balanceBefore.plus(
            debit.amount,
          );

        await tx.wallet.update({
          where: {
            id:
              currentWallet.id,
          },

          data: {
            balance:
              balanceAfter,
          },
        });

        const refund =
          await tx.walletTransaction.create({
            data: {
              walletId:
                currentWallet.id,

              messageId,

              type:
                'REFUND',

              status:
                'COMPLETED',

              amount:
                debit.amount,

              currency:
                debit.currency,

              balanceBefore,

              balanceAfter,

              reference:
                `refund-${debit.id}`,

              description:
                `Automatic refund for failed SMS ${messageId}`,
            },
          });

        await tx.walletTransaction.update({
          where: {
            id:
              debit.id,
          },

          data: {
            status:
              'REVERSED',
          },
        });

        return {
          refunded:
            true,

          refund,
        };
      },
    );
  }

  private async dispatchSms(
    provider: string,
    dto: SendSmsDto,
    sender: string,
  ) {
    if (provider === 'mock') {
  return {
    provider: 'mock',
    status: 'accepted',
    messageId: `mock-${Date.now()}`,
    raw: {
      to: dto.to,
      sender,
      text: dto.text,
    },
  };
}

    if (provider === 'infobip') {
      return this.infobipProvider.sendSms(
        dto,
      );
    }

    if (provider === 'routemobile') {
      return this.routeMobileProvider.sendSms(
        dto,
        sender,
      );
    }

    throw new InternalServerErrorException(
      `Unsupported messaging provider: ${provider}`,
    );
  }

  async getMessages() {
    return this.prisma.message.findMany({
      orderBy: {
        createdAt:
          'desc',
      },

      take:
        100,
    });
  }

  async getMessage(id: string) {
    return this.prisma.message.findUnique({
      where: {
        id,
      },

      include: {
        routingAttempts: {
          orderBy: {
            attemptNumber:
              'asc',
          },
        },

        walletTransactions: {
          orderBy: {
            createdAt:
              'asc',
          },
        },
      },
    });
  }

  async getRoutingAttempts(
    messageId: string,
  ) {
    const message =
      await this.prisma.message.findUnique({
        where: {
          id:
            messageId,
        },

        select: {
          id:
            true,
        },
      });

    if (!message) {
      throw new BadRequestException(
        'Message not found',
      );
    }

    return this.prisma.messageRoutingAttempt.findMany({
      where: {
        messageId,
      },

      orderBy: {
        attemptNumber:
          'asc',
      },
    });
  }

  async getSummary() {
    const messages =
      await this.prisma.message.findMany({
        where: {
          providerCost: {
            not:
              null,
          },

          customerPrice: {
            not:
              null,
          },
        },

        select: {
          providerCost:
            true,

          customerPrice:
            true,

          currency:
            true,

          status:
            true,
        },
      });

    let providerCostTotal =
      new Prisma.Decimal(0);

    let customerRevenueTotal =
      new Prisma.Decimal(0);

    for (const message of messages) {
      if (message.providerCost) {
        providerCostTotal =
          providerCostTotal.plus(
            message.providerCost,
          );
      }

      if (message.customerPrice) {
        customerRevenueTotal =
          customerRevenueTotal.plus(
            message.customerPrice,
          );
      }
    }

    const grossMargin =
      customerRevenueTotal.minus(
        providerCostTotal,
      );

    const grossMarginPercent =
      customerRevenueTotal.gt(0)
        ? grossMargin
            .div(
              customerRevenueTotal,
            )
            .mul(100)
        : new Prisma.Decimal(0);

    return {
      messageCount:
        messages.length,

      providerCostTotal:
        providerCostTotal.toFixed(6),

      customerRevenueTotal:
        customerRevenueTotal.toFixed(6),

      grossMargin:
        grossMargin.toFixed(6),

      grossMarginPercent:
        grossMarginPercent.toFixed(2),
    };
  }

  async handleDeliveryWebhook(
    dto: DeliveryWebhookDto,
  ) {
    const message =
      await this.prisma.message.findFirst({
        where: {
          providerMessageId:
            dto.providerMessageId,
        },
      });

    if (!message) {
      throw new BadRequestException(
        'Message not found for providerMessageId',
      );
    }

    const normalizedStatus =
      dto.status.toUpperCase();

    if (
      ![
        'SENT',
        'DELIVERED',
        'FAILED',
      ].includes(normalizedStatus)
    ) {
      throw new BadRequestException(
        `Unsupported delivery status: ${dto.status}`,
      );
    }

    if (
      message.status === 'DELIVERED' &&
      normalizedStatus !== 'DELIVERED'
    ) {
      throw new BadRequestException(
        'Delivered message cannot move backwards',
      );
    }

    const now =
      new Date();

    return this.prisma.message.update({
      where: {
        id:
          message.id,
      },

      data: {
        status:
          normalizedStatus as
            | 'SENT'
            | 'DELIVERED'
            | 'FAILED',

        sentAt:
          normalizedStatus === 'SENT'
            ? now
            : message.sentAt,

        deliveredAt:
          normalizedStatus ===
          'DELIVERED'
            ? now
            : message.deliveredAt,

        failureReason:
          normalizedStatus === 'FAILED'
            ? dto.failureReason ??
              'Provider reported delivery failure'
            : null,
      },
    });
  }

  async handleInfobipDeliveryReport(
    dto: InfobipDeliveryReportDto,
  ) {
    const updates = [];

    for (const result of dto.results) {
      const message =
        await this.prisma.message.findFirst({
          where: {
            providerMessageId:
              result.messageId,
          },
        });

      if (!message) {
        updates.push({
          messageId:
            result.messageId,

          status:
            'IGNORED',

          reason:
            'Message not found',
        });

        continue;
      }

      const providerStatus =
        result.status.groupName.toUpperCase();

      let internalStatus:
        | 'SENT'
        | 'DELIVERED'
        | 'FAILED';

      switch (providerStatus) {
        case 'PENDING':
          internalStatus =
            'SENT';
          break;

        case 'DELIVERED':
          internalStatus =
            'DELIVERED';
          break;

        case 'UNDELIVERABLE':
        case 'EXPIRED':
        case 'REJECTED':
          internalStatus =
            'FAILED';
          break;

        default:
          updates.push({
            messageId:
              result.messageId,

            status:
              'IGNORED',

            reason:
              `Unsupported Infobip status: ${providerStatus}`,
          });

          continue;
      }

      if (
        message.status ===
          'DELIVERED' ||
        message.status ===
          internalStatus
      ) {
        updates.push({
          messageId:
            result.messageId,

          status:
            'UNCHANGED',

          currentStatus:
            message.status,
        });

        continue;
      }

      const sentAt =
        result.sentAt &&
        !Number.isNaN(
          Date.parse(
            result.sentAt,
          ),
        )
          ? new Date(
              result.sentAt,
            )
          : undefined;

      const deliveredAt =
        internalStatus ===
          'DELIVERED' &&
        result.doneAt &&
        !Number.isNaN(
          Date.parse(
            result.doneAt,
          ),
        )
          ? new Date(
              result.doneAt,
            )
          : undefined;

      const failureReason =
        internalStatus === 'FAILED'
          ? result.error?.description ??
            result.status.description ??
            'Infobip reported delivery failure'
          : null;

      const updated =
        await this.prisma.message.update({
          where: {
            id:
              message.id,
          },

          data: {
            status:
              internalStatus,

            sentAt:
              internalStatus === 'SENT' ||
              internalStatus ===
                'DELIVERED'
                ? sentAt ??
                  message.sentAt ??
                  new Date()
                : message.sentAt,

            deliveredAt:
              internalStatus ===
              'DELIVERED'
                ? deliveredAt ??
                  new Date()
                : message.deliveredAt,

            failureReason,
          },
        });

      updates.push({
        messageId:
          result.messageId,

        status:
          'UPDATED',

        internalStatus:
          updated.status,
      });
    }

    return {
      processed:
        dto.results.length,

      updates,
    };
  }

  async handleRouteMobileDeliveryReport(
    dto: RouteMobileDeliveryReportDto,
  ) {
    const message =
      await this.prisma.message.findFirst({
        where: {
          providerMessageId:
            dto.sMessageId,
        },
      });

    if (!message) {
      return {
        messageId:
          dto.sMessageId,

        status:
          'IGNORED',

        reason:
          'Message not found',
      };
    }

    const providerStatus =
      dto.sStatus
        .trim()
        .toUpperCase();

    let internalStatus:
      | 'SENT'
      | 'DELIVERED'
      | 'FAILED';

    switch (providerStatus) {
      case 'ACCEPTED':
      case 'ACKED':
      case 'ENROUTE':
        internalStatus =
          'SENT';
        break;

      case 'DELIVRD':
      case 'DELIVERED':
        internalStatus =
          'DELIVERED';
        break;

      case 'UNDELIV':
      case 'UNDELIVERABLE':
      case 'EXPIRED':
      case 'REJECTD':
      case 'REJECTED':
      case 'DELETED':
        internalStatus =
          'FAILED';
        break;

      default:
        return {
          messageId:
            dto.sMessageId,

          status:
            'IGNORED',

          reason:
            `Unsupported Route Mobile status: ${providerStatus}`,
        };
    }

    if (
      message.status ===
        internalStatus ||
      message.status ===
        'DELIVERED'
    ) {
      return {
        messageId:
          dto.sMessageId,

        status:
          'UNCHANGED',

        currentStatus:
          message.status,
      };
    }

    const parseDate = (
      value?: string,
    ): Date | undefined => {
      if (!value) {
        return undefined;
      }

      const timestamp =
        Date.parse(value);

      return Number.isNaN(timestamp)
        ? undefined
        : new Date(timestamp);
    };

    const sentAt =
      parseDate(
        dto.dtSubmit,
      );

    const deliveredAt =
      parseDate(
        dto.dtDone,
      );

    const updated =
      await this.prisma.message.update({
        where: {
          id:
            message.id,
        },

        data: {
          status:
            internalStatus,

          sentAt:
            internalStatus === 'SENT' ||
            internalStatus ===
              'DELIVERED'
              ? sentAt ??
                message.sentAt ??
                new Date()
              : message.sentAt,

          deliveredAt:
            internalStatus ===
            'DELIVERED'
              ? deliveredAt ??
                message.deliveredAt ??
                new Date()
              : message.deliveredAt,

          failureReason:
            internalStatus === 'FAILED'
              ? dto.sError ??
                dto.sErrCode ??
                `Route Mobile status: ${providerStatus}`
              : null,
        },
      });

    return {
      messageId:
        dto.sMessageId,

      status:
        'UPDATED',

      internalStatus:
        updated.status,
    };
  }

  async downloadRouteMobileCoverageMap() {
    return this.routeMobileProvider.downloadCoverageMap();
  }
}
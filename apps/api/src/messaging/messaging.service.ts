import { Prisma, SmsUnitTransactionType, WalletTransactionStatus, } from '@prisma/client';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { SendSmsDto } from './dto/send-sms.dto.js';
import { SendBatchSmsDto } from './dto/send-batch-sms.dto.js';
import { InfobipDeliveryReportDto } from './dto/infobip-delivery-report.dto.js';
import { RouteMobileDeliveryReportDto } from './dto/routemobile-delivery-report.dto.js';
import { InfobipProvider } from './providers/infobip.provider.js';
import { RouteMobileProvider } from './providers/routemobile.provider.js';
import { MessagingProviderError } from './providers/provider-error.js';
import { createHash } from 'node:crypto';
import { calculateSmsUsage } from './sms-usage.js';
@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  constructor(private readonly prisma: PrismaService, private readonly infobipProvider: InfobipProvider, private readonly routeMobileProvider: RouteMobileProvider) { }
  async sendSms(dto: SendSmsDto, authenticatedBusinessId: string) {
    const configuredProvider = process.env.MESSAGING_PROVIDER ?? 'mock';
    const smsUsage = calculateSmsUsage(dto.text);
    const senderRegistration = await this.prisma.senderRegistration.findUnique({
      where: {
        id: dto.senderRegistrationId,
      },
    });
    if (!senderRegistration) {
      throw new BadRequestException('Sender registration not found');
    }
    if (senderRegistration.businessId !== authenticatedBusinessId) {
      throw new BadRequestException('Sender registration does not belong to the authenticated business');
    }
    if (senderRegistration.status !== 'APPROVED') {
      throw new BadRequestException(`Sender registration is not approved. Current status: ${senderRegistration.status}`);
    }
    if (senderRegistration.channel !== 'SMS') {
      throw new BadRequestException('Sender registration is not approved for SMS');
    }
    const pricingCountryCode = senderRegistration.destinationCountry ?? senderRegistration.countryCode;
    /*
 
     * Resolve the normalized sender identity and determine which
 
     * providers are actually approved to use this sender.
 
     */
    const senderIdentity = await this.prisma.senderIdentity.findFirst({
      where: {
        businessId: senderRegistration.businessId,
        channel: 'SMS',
        senderValue: senderRegistration.senderValue,
        countryCode: senderRegistration.countryCode,
      },
      include: {
        providerRegistrations: {
          where: {
            status: 'APPROVED',
          },
          include: {
            provider: true,
          },
        },
      },
    });
    if (!senderIdentity) {
      throw new BadRequestException('Normalized sender identity not found');
    }
    const approvedProviderCodes = senderIdentity.providerRegistrations
      .filter((registration) => registration.provider.enabled && registration.provider.supportsSms)
      .map((registration) => registration.provider.code);
    if (approvedProviderCodes.length === 0) {
      throw new BadRequestException('Sender is not fully configured for SMS delivery');
    }
    const now = new Date();
    let routingRule: {
      id: string;
      provider: string;
      priority: number;
    } | null = null;
    let commercialProvider: string;
    /*
 
     * Mock mode still performs real routing and pricing resolution.
 
     * Only the provider transport itself is mocked.
 
     */
    if (configuredProvider === 'mock') {
      routingRule = await this.prisma.providerRoutingRule.findFirst({
        where: {
          countryCode: pricingCountryCode,
          channel: 'SMS',
          enabled: true,
          network: null,
          provider: {
            in: approvedProviderCodes,
          },
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
        throw new BadRequestException(`No active SMS routing rule configured for ${pricingCountryCode}`);
      }
      commercialProvider = routingRule.provider;
    }
    else {
      commercialProvider = configuredProvider;
      if (!approvedProviderCodes.includes(commercialProvider)) {
        throw new BadRequestException('Sender is not available for the selected SMS route');
      }
      routingRule = await this.prisma.providerRoutingRule.findFirst({
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
    const pricing = await this.prisma.countryPricing.findFirst({
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
      throw new BadRequestException(`No active SMS pricing configured for ${pricingCountryCode}`);
    }
    const providerCostTotal = pricing.providerCost.mul(smsUsage.segmentCount);
    const customerPriceTotal = pricing.retailPrice.mul(smsUsage.segmentCount);
    const wallet = await this.prisma.wallet.findUnique({
      where: {
        businessId: senderRegistration.businessId,
      },
    });
    if (!wallet) {
      throw new BadRequestException('Business wallet not found');
    }
    if (wallet.currency !== pricing.currency) {
      throw new BadRequestException(`Wallet currency ${wallet.currency} does not match message pricing currency ${pricing.currency}`);
    }
    if (wallet.smsUnits < smsUsage.segmentCount) {
      throw new BadRequestException('Insufficient SMS units');
    }
    const dispatchProvider = configuredProvider === 'mock' ? 'mock' : commercialProvider;
    /*
     * Message creation, SMS-unit debit and unit-ledger creation happen
     * together. If any operation fails, none of them are committed.
     *
     * customerPrice remains informational/customer-facing and is derived
     * from local pricing. It does not directly debit the monetary wallet.
     */
    const { message, debitTransaction } = await this.prisma.$transaction(async (tx) => {
      const currentWallet = await tx.wallet.findUniqueOrThrow({
        where: {
          id: wallet.id,
        },
      });
      if (currentWallet.currency !== pricing.currency) {
        throw new BadRequestException(`Wallet currency ${currentWallet.currency} does not match message pricing currency ${pricing.currency}`);
      }
      const createdMessage = await tx.message.create({
        data: {
          businessId: senderRegistration.businessId,
          senderRegistrationId: senderRegistration.id,
          channel: 'SMS',
          provider: commercialProvider,
          sender: senderRegistration.senderValue,
          recipient: dto.to,
          content: dto.text,
          status: 'QUEUED',
          countryCode: senderRegistration.countryCode,
          destinationCountry: pricingCountryCode,
          characterCount: smsUsage.characterCount,
          segmentCount: smsUsage.segmentCount,
          smsEncoding: smsUsage.encoding,
          providerCost: providerCostTotal,
          customerPrice: customerPriceTotal,
          currency: pricing.currency,
        },
      });
      /*
       * Atomic unit debit. The condition prevents concurrent sends from
       * taking the unit balance below zero.
       */
      const debitResult = await tx.wallet.updateMany({
        where: {
          id: currentWallet.id,
          smsUnits: {
            gte: smsUsage.segmentCount,
          },
        },
        data: {
          smsUnits: {
            decrement: smsUsage.segmentCount,
          },
        },
      });
      if (debitResult.count !== 1) {
        throw new BadRequestException('Insufficient SMS units');
      }
      const updatedWallet = await tx.wallet.findUniqueOrThrow({
        where: {
          id: currentWallet.id,
        },
      });
      const balanceAfter = updatedWallet.smsUnits;
      const balanceBefore = balanceAfter + smsUsage.segmentCount;
      const createdDebitTransaction = await tx.smsUnitTransaction.create({
        data: {
          walletId: currentWallet.id,
          messageId: createdMessage.id,
          type: SmsUnitTransactionType.MESSAGE_DEBIT,
          status: WalletTransactionStatus.COMPLETED,
          units: -smsUsage.segmentCount,
          balanceBefore,
          balanceAfter,
          reference: `sms-${createdMessage.id}`,
          description: `SMS usage to ${dto.to} (${smsUsage.segmentCount} unit${smsUsage.segmentCount === 1 ? '' : 's'})`,
        },
      });
      return {
        message: createdMessage,
        debitTransaction: createdDebitTransaction,
      };
    });
    /*
 
     * Everything below this point happens after the customer
 
     * has consumed SMS units. Any definitive dispatch failure therefore
 
     * passes through failMessageAndRefundUnits().
 
     */
    try {
      const primaryRoutingAttempt = await this.prisma.messageRoutingAttempt.create({
        data: {
          messageId: message.id,
          routingRuleId: routingRule?.id ?? null,
          provider: commercialProvider,
          priority: routingRule?.priority ?? null,
          attemptNumber: 1,
          outcome: 'STARTED',
        },
      });
      let result;
      try {
        result = await this.dispatchSms(dispatchProvider, dto, senderRegistration.senderValue);
        await this.prisma.messageRoutingAttempt.update({
          where: {
            id: primaryRoutingAttempt.id,
          },
          data: {
            outcome: 'ACCEPTED',
          },
        });
      }
      catch (error) {
        await this.prisma.messageRoutingAttempt.update({
          where: {
            id: primaryRoutingAttempt.id,
          },
          data: {
            outcome: 'FAILED',
            retryable: error instanceof MessagingProviderError ? error.retryable : false,
            errorCode: error instanceof MessagingProviderError ? error.code : undefined,
            errorMessage: error instanceof Error ? error.message : 'Unknown provider error',
          },
        });
        /*
 
         * Mock mode never performs real failover.
 
         *
 
         * Real failover is permitted only for a provider error
 
         * explicitly marked retryable.
 
         */
        if (configuredProvider === 'mock' ||
          !(error instanceof MessagingProviderError) ||
          !error.retryable) {
          throw error;
        }
        const fallbackRule = await this.prisma.providerRoutingRule.findFirst({
          where: {
            countryCode: pricingCountryCode,
            channel: 'SMS',
            enabled: true,
            network: null,
            provider: {
              in: approvedProviderCodes.filter((provider) => provider !== commercialProvider),
            },
          },
          orderBy: {
            priority: 'asc',
          },
        });
        if (!fallbackRule) {
          throw error;
        }
        const fallbackPricing = await this.prisma.countryPricing.findFirst({
          where: {
            countryCode: pricingCountryCode,
            channel: 'SMS',
            provider: fallbackRule.provider,
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
        if (!fallbackPricing) {
          throw error;
        }
        /*
 
         * The customer's retail charge was established before
 
         * dispatch. Failover may change Hiffs' provider cost,
 
         * but must not silently change the customer's price.
 
         */
        if (fallbackPricing.currency !== pricing.currency) {
          throw new InternalServerErrorException(`Fallback provider pricing currency ${fallbackPricing.currency} does not match original message currency ${pricing.currency}`);
        }
        const fallbackAttempt = await this.prisma.messageRoutingAttempt.create({
          data: {
            messageId: message.id,
            routingRuleId: fallbackRule.id,
            provider: fallbackRule.provider,
            priority: fallbackRule.priority,
            attemptNumber: 2,
            outcome: 'STARTED',
          },
        });
        try {
          result = await this.dispatchSms(fallbackRule.provider, dto, senderRegistration.senderValue);
          await this.prisma.messageRoutingAttempt.update({
            where: {
              id: fallbackAttempt.id,
            },
            data: {
              outcome: 'ACCEPTED',
            },
          });
          commercialProvider = fallbackRule.provider;
          /*
 
           * Only actual provider and provider cost change.
 
           *
 
           * customerPrice and currency remain the original
 
           * commercial quote already charged to the wallet.
 
           */
          await this.prisma.message.update({
            where: {
              id: message.id,
            },
            data: {
              provider: fallbackRule.provider,
              providerCost: fallbackPricing.providerCost.mul(smsUsage.segmentCount),
            },
          });
        }
        catch (fallbackError) {
          await this.prisma.messageRoutingAttempt.update({
            where: {
              id: fallbackAttempt.id,
            },
            data: {
              outcome: 'FAILED',
              retryable: fallbackError instanceof MessagingProviderError
                ? fallbackError.retryable
                : false,
              errorCode: fallbackError instanceof MessagingProviderError
                ? fallbackError.code
                : undefined,
              errorMessage: fallbackError instanceof Error
                ? fallbackError.message
                : 'Unknown fallback provider error',
            },
          });
          throw fallbackError;
        }
      }
      return await this.prisma.message.update({
        where: {
          id: message.id,
        },
        data: {
          provider: commercialProvider,
          providerMessageId: result.messageId,
          status: 'ACCEPTED',
          providerResponse: result.raw as Prisma.InputJsonValue,
          failureReason: null,
        },
        select: {
          id: true,
          channel: true,
          sender: true,
          recipient: true,
          content: true,
          characterCount: true,
          segmentCount: true,
          smsEncoding: true,
          status: true,
          customerPrice: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
          sentAt: true,
          deliveredAt: true,
        },
      });
    }
    catch (error) {
      const failureReason = error instanceof Error
        ? error.message
        : 'Unknown messaging provider error';
      try {
        await this.failMessageAndRefundUnits(message.id, debitTransaction.id, failureReason);
      }
      catch (billingError) {
        this.logger.error(`Failed to reconcile SMS units after dispatch failure for message ${message.id}`, billingError instanceof Error
          ? billingError.stack
          : String(billingError));
        /*
 
         * Best effort to at least preserve the message failure
 
         * even if SMS-unit reconciliation itself fails.
 
         */
        try {
          await this.prisma.message.update({
            where: {
              id: message.id,
            },
            data: {
              status: 'FAILED',
              failureReason: `${failureReason} | SMS unit refund reconciliation failed`,
            },
          });
        }
        catch (messageUpdateError) {
          this.logger.error(`Failed to mark message ${message.id} as FAILED`, messageUpdateError instanceof Error
            ? messageUpdateError.stack
            : String(messageUpdateError));
        }
      }
      throw new InternalServerErrorException(
        'SMS submission failed. Please try again.',
      );
    }
  }
  /**
   * Marks the message as FAILED and reverses its completed SMS-unit debit
   * in one database transaction.
   *
   * The method is idempotent: a debit that was already reversed cannot
   * restore units twice.
   */
  private async failMessageAndRefundUnits(messageId: string, debitTransactionId: string, failureReason: string) {
    return this.prisma.$transaction(async (tx) => {
      const debit = await tx.smsUnitTransaction.findUnique({
        where: {
          id: debitTransactionId,
        },
      });
      if (!debit) {
        throw new Error(`SMS unit debit ${debitTransactionId} not found`);
      }
      await tx.message.update({
        where: {
          id: messageId,
        },
        data: {
          status: 'FAILED',
          failureReason,
        },
      });
      if (debit.status === WalletTransactionStatus.REVERSED) {
        const existingRefund = await tx.smsUnitTransaction.findFirst({
          where: {
            walletId: debit.walletId,
            messageId,
            type: SmsUnitTransactionType.REFUND,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        return {
          refunded: false,
          reason: 'SMS unit debit already reversed',
          refund: existingRefund,
        };
      }
      if (debit.type !== SmsUnitTransactionType.MESSAGE_DEBIT) {
        throw new Error(`SMS unit transaction ${debit.id} is not a MESSAGE_DEBIT`);
      }
      if (debit.status !== WalletTransactionStatus.COMPLETED) {
        throw new Error(`SMS unit debit ${debit.id} cannot be refunded from status ${debit.status}`);
      }
      const existingRefund = await tx.smsUnitTransaction.findFirst({
        where: {
          walletId: debit.walletId,
          messageId,
          type: SmsUnitTransactionType.REFUND,
          status: WalletTransactionStatus.COMPLETED,
        },
      });
      if (existingRefund) {
        await tx.smsUnitTransaction.update({
          where: {
            id: debit.id,
          },
          data: {
            status: WalletTransactionStatus.REVERSED,
          },
        });
        return {
          refunded: false,
          reason: 'SMS unit refund already exists',
          refund: existingRefund,
        };
      }
      const refundUnits = Math.abs(debit.units);
      await tx.wallet.update({
        where: {
          id: debit.walletId,
        },
        data: {
          smsUnits: {
            increment: refundUnits,
          },
        },
      });
      const updatedWallet = await tx.wallet.findUniqueOrThrow({
        where: {
          id: debit.walletId,
        },
      });
      const balanceAfter = updatedWallet.smsUnits;
      const balanceBefore = balanceAfter - refundUnits;
      const refund = await tx.smsUnitTransaction.create({
        data: {
          walletId: debit.walletId,
          messageId,
          type: SmsUnitTransactionType.REFUND,
          status: WalletTransactionStatus.COMPLETED,
          units: refundUnits,
          balanceBefore,
          balanceAfter,
          reference: `refund-${debit.id}`,
          description: `Automatic SMS unit refund for failed message ${messageId}`,
        },
      });
      await tx.smsUnitTransaction.update({
        where: {
          id: debit.id,
        },
        data: {
          status: WalletTransactionStatus.REVERSED,
        },
      });
      return {
        refunded: true,
        units: refundUnits,
        refund,
      };
    });
  }
  private async dispatchSms(provider: string, dto: SendSmsDto, sender: string) {
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
      return this.infobipProvider.sendSms(dto, sender);
    }
    if (provider === 'routemobile') {
      return this.routeMobileProvider.sendSms(dto, sender);
    }
    throw new InternalServerErrorException(`Unsupported messaging provider: ${provider}`);
  }
  async sendBatchSms(dto: SendBatchSmsDto, authenticatedBusinessId: string) {
    const recipients = [
      ...new Set(dto.recipients.map((recipient) => recipient.trim())),
    ];
    const results = [];
    for (const to of recipients) {
      try {
        const result = await this.sendSms({
          to,
          text: dto.text,
          senderRegistrationId: dto.senderRegistrationId,
        }, authenticatedBusinessId);
        results.push({
          to,
          success: true,
          id: result.id,
          status: result.status,
          segmentCount: result.segmentCount,
          customerPrice: result.customerPrice,
          currency: result.currency,
        });
      }
      catch (error) {
        results.push({
          to,
          success: false,
          error: error instanceof Error
            ? error.message
            : 'SMS submission failed',
        });
      }
    }
    return {
      submitted: recipients.length,
      successful: results.filter((result) => result.success).length,
      failed: results.filter((result) => !result.success).length,
      results,
    };
  }
  async getMessages(businessId: string) {
    return this.prisma.message.findMany({
      where: {
        businessId,
      },
      select: {
        id: true,
        channel: true,
        sender: true,
        recipient: true,
        content: true,
        characterCount: true,
        segmentCount: true,
        smsEncoding: true,
        status: true,
        customerPrice: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        sentAt: true,
        deliveredAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }
  async getMessage(businessId: string, id: string) {
    return this.prisma.message.findFirst({
      where: {
        id,
        businessId,
      },
      select: {
        id: true,
        channel: true,
        sender: true,
        recipient: true,
        content: true,
        characterCount: true,
        segmentCount: true,
        smsEncoding: true,
        status: true,
        customerPrice: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        sentAt: true,
        deliveredAt: true,
      },
    });
  }
  async getSummary(businessId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        businessId,
      },
      select: {
        status: true,
        segmentCount: true,
        customerPrice: true,
        currency: true,
      },
    });
    const delivered = messages.filter((message) => message.status === 'DELIVERED').length;
    const failed = messages.filter((message) => message.status === 'FAILED').length;
    const pending = messages.filter((message) => ['QUEUED', 'ACCEPTED', 'SENT'].includes(message.status)).length;
    const totalSegments = messages.reduce((total, message) => total + (message.segmentCount ?? 0), 0);
    let totalSpend = new Prisma.Decimal(0);
    for (const message of messages) {
      if (message.customerPrice) {
        totalSpend = totalSpend.plus(message.customerPrice);
      }
    }
    const currency = messages.find((message) => message.currency)?.currency ?? null;
    return {
      messageCount: messages.length,
      delivered,
      pending,
      failed,
      totalSegments,
      totalSpend: totalSpend.toFixed(6),
      currency,
    };
  }
  async handleInfobipDeliveryReport(dto: InfobipDeliveryReportDto) {
    const updates = [];
    for (const result of dto.results) {
      const providerStatus = result.status.groupName.toUpperCase();
      const eventKey = this.webhookEventKey('infobip', [
        result.messageId,
        result.status.id,
        result.status.groupId,
        result.status.name,
        result.doneAt,
        result.error?.id,
      ]);
      const receiptResult = await this.createWebhookReceipt('infobip', eventKey, result.messageId, providerStatus, result as unknown as Prisma.InputJsonValue);
      const receipt = receiptResult.receipt;
      if (!receipt) {
        throw new InternalServerErrorException('Unable to resolve Infobip webhook receipt');
      }
      /*
  
       * If this exact provider event was already processed,
  
       * acknowledge it without changing message state again.
  
       */
      if (receiptResult.duplicate &&
        receipt.processedAt) {
        updates.push({
          messageId: result.messageId,
          status: 'DUPLICATE',
        });
        continue;
      }
      try {
        const message = await this.prisma.message.findFirst({
          where: {
            providerMessageId: result.messageId,
            provider: 'infobip',
          },
        });
        if (!message) {
          await this.completeWebhookReceipt(receipt.id);
          updates.push({
            messageId: result.messageId,
            status: 'IGNORED',
            reason: 'Message not found',
          });
          continue;
        }
        let internalStatus: 'SENT' | 'DELIVERED' | 'FAILED';
        switch (providerStatus) {
          case 'PENDING':
            internalStatus = 'SENT';
            break;
          case 'DELIVERED':
            internalStatus = 'DELIVERED';
            break;
          case 'UNDELIVERABLE':
          case 'EXPIRED':
          case 'REJECTED':
            internalStatus = 'FAILED';
            break;
          default:
            await this.completeWebhookReceipt(receipt.id);
            updates.push({
              messageId: result.messageId,
              status: 'IGNORED',
              reason: `Unsupported Infobip status: ${providerStatus}`,
            });
            continue;
        }
        /*
  
         * DELIVERED is terminal for our current SMS state
  
         * machine. A delayed provider callback cannot move
  
         * the message backwards.
  
         */
        if (message.status === 'DELIVERED' ||
          message.status === internalStatus) {
          await this.completeWebhookReceipt(receipt.id);
          updates.push({
            messageId: result.messageId,
            status: 'UNCHANGED',
            currentStatus: message.status,
          });
          continue;
        }
        const sentAt = result.sentAt &&
          !Number.isNaN(Date.parse(result.sentAt))
          ? new Date(result.sentAt)
          : undefined;
        const deliveredAt = internalStatus === 'DELIVERED' &&
          result.doneAt &&
          !Number.isNaN(Date.parse(result.doneAt))
          ? new Date(result.doneAt)
          : undefined;
        const failureReason = internalStatus === 'FAILED'
          ? (result.error?.description ??
            result.status.description ??
            'Infobip reported delivery failure')
          : null;
        const updated = await this.prisma.message.update({
          where: {
            id: message.id,
          },
          data: {
            status: internalStatus,
            sentAt: internalStatus === 'SENT' ||
              internalStatus === 'DELIVERED'
              ? (sentAt ??
                message.sentAt ??
                new Date())
              : message.sentAt,
            deliveredAt: internalStatus === 'DELIVERED'
              ? (deliveredAt ??
                message.deliveredAt ??
                new Date())
              : message.deliveredAt,
            failureReason,
          },
        });
        await this.completeWebhookReceipt(receipt.id);
        updates.push({
          messageId: result.messageId,
          status: 'UPDATED',
          internalStatus: updated.status,
        });
      }
      catch (error) {
        try {
          await this.failWebhookReceipt(receipt.id, error);
        }
        catch (receiptError) {
          this.logger.error(`Failed to record Infobip webhook processing error for receipt ${receipt.id}`, receiptError instanceof Error
            ? receiptError.stack
            : String(receiptError));
        }
        throw error;
      }
    }
    return {
      processed: dto.results.length,
      updates,
    };
  }
  async handleRouteMobileDeliveryReport(dto: RouteMobileDeliveryReportDto) {
    const providerStatus = dto.sStatus.trim().toUpperCase();
    const eventKey = this.webhookEventKey('routemobile', [
      dto.sMessageId,
      providerStatus,
      dto.dtSubmit,
      dto.dtDone,
      dto.iErrCode,
      dto.iCharge,
    ]);
    const receiptResult = await this.createWebhookReceipt('routemobile', eventKey, dto.sMessageId, providerStatus, dto as unknown as Prisma.InputJsonValue);
    const receipt = receiptResult.receipt;
    if (!receipt) {
      throw new InternalServerErrorException('Unable to resolve Route Mobile webhook receipt');
    }
    /*
  
     * An exact Route Mobile retry that has already been
  
     * successfully processed is acknowledged without
  
     * touching the Message record again.
  
     */
    if (receiptResult.duplicate &&
      receipt.processedAt) {
      return {
        messageId: dto.sMessageId,
        status: 'DUPLICATE',
      };
    }
    try {
      const message = await this.prisma.message.findFirst({
        where: {
          providerMessageId: dto.sMessageId,
          provider: 'routemobile',
        },
      });
      if (!message) {
        await this.completeWebhookReceipt(receipt.id);
        return {
          messageId: dto.sMessageId,
          status: 'IGNORED',
          reason: 'Message not found',
        };
      }
      let internalStatus: 'SENT' | 'DELIVERED' | 'FAILED';
      switch (providerStatus) {
        case 'ACCEPTED':
        case 'ACKED':
        case 'ENROUTE':
          internalStatus = 'SENT';
          break;
        case 'DELIVRD':
        case 'DELIVERED':
          internalStatus = 'DELIVERED';
          break;
        case 'UNDELIV':
        case 'UNDELIVERABLE':
        case 'EXPIRED':
        case 'REJECTD':
        case 'REJECTED':
        case 'DELETED':
          internalStatus = 'FAILED';
          break;
        default:
          await this.completeWebhookReceipt(receipt.id);
          return {
            messageId: dto.sMessageId,
            status: 'IGNORED',
            reason: `Unsupported Route Mobile status: ${providerStatus}`,
          };
      }
      /*
  
       * DELIVERED is terminal for our current state machine.
  
       * Late or duplicate DLRs must not move a delivered
  
       * message backwards.
  
       */
      if (message.status ===
        internalStatus ||
        message.status ===
        'DELIVERED') {
        await this.completeWebhookReceipt(receipt.id);
        return {
          messageId: dto.sMessageId,
          status: 'UNCHANGED',
          currentStatus: message.status,
        };
      }
      const parseDate = (value?: string): Date | undefined => {
        if (!value) {
          return undefined;
        }
        const timestamp = Date.parse(value);
        return Number.isNaN(timestamp)
          ? undefined
          : new Date(timestamp);
      };
      const sentAt = parseDate(dto.dtSubmit);
      const deliveredAt = parseDate(dto.dtDone);
      const updated = await this.prisma.message.update({
        where: {
          id: message.id,
        },
        data: {
          status: internalStatus,
          sentAt: internalStatus === 'SENT' ||
            internalStatus === 'DELIVERED'
            ? (sentAt ??
              message.sentAt ??
              new Date())
            : message.sentAt,
          deliveredAt: internalStatus ===
            'DELIVERED'
            ? (deliveredAt ??
              message.deliveredAt ??
              new Date())
            : message.deliveredAt,
          failureReason: internalStatus === 'FAILED'
            ? (dto.sError ??
              dto.iErrCode ??
              `Route Mobile status: ${providerStatus}`)
            : null,
        },
      });
      await this.completeWebhookReceipt(receipt.id);
      return {
        messageId: dto.sMessageId,
        status: 'UPDATED',
        internalStatus: updated.status,
      };
    }
    catch (error) {
      try {
        await this.failWebhookReceipt(receipt.id, error);
      }
      catch (receiptError) {
        this.logger.error(`Failed to record Route Mobile webhook processing error for receipt ${receipt.id}`, receiptError instanceof Error
          ? receiptError.stack
          : String(receiptError));
      }
      throw error;
    }
  }
  async downloadRouteMobileCoverageMap() {
    return this.routeMobileProvider.downloadCoverageMap();
  }
  private webhookEventKey(provider: string, parts: Array<string | number | null | undefined>) {
    return createHash('sha256')
      .update([
        provider,
        ...parts.map((part) => String(part ?? '')),
      ].join('|'))
      .digest('hex');
  }
  private async createWebhookReceipt(provider: string, eventKey: string, providerMessageId: string, providerStatus: string, payload: Prisma.InputJsonValue) {
    try {
      const receipt = await this.prisma.webhookReceipt.create({
        data: {
          provider,
          eventKey,
          providerMessageId,
          providerStatus,
          payload,
        },
      });
      return {
        duplicate: false,
        receipt,
      };
    }
    catch (error) {
      if (error instanceof
        Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002') {
        const receipt = await this.prisma.webhookReceipt.findUnique({
          where: {
            provider_eventKey: {
              provider,
              eventKey,
            },
          },
        });
        return {
          duplicate: true,
          receipt,
        };
      }
      throw error;
    }
  }
  private async completeWebhookReceipt(id: string) {
    await this.prisma.webhookReceipt.update({
      where: {
        id,
      },
      data: {
        processedAt: new Date(),
        processingError: null,
      },
    });
  }
  private async failWebhookReceipt(id: string, error: unknown) {
    const message = error instanceof Error
      ? error.message
      : String(error);
    await this.prisma.webhookReceipt.update({
      where: {
        id,
      },
      data: {
        processingError: message,
      },
    });
  }
}


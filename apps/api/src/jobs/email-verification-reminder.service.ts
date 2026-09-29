import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '../prisma.service.js';
import { EmailService } from '../email/email.service.js';

const HOUR =
  60 * 60 * 1000;

const DAY =
  24 * HOUR;

@Injectable()
export class EmailVerificationReminderService {
  private readonly logger =
    new Logger(
      EmailVerificationReminderService.name,
    );

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private determineNextReminder(
    reminderCount: number,
    createdAt: Date,
    oneDayAgo: Date,
    threeDaysAgo: Date,
    sevenDaysAgo: Date,
  ): 1 | 2 | 3 | null {
    if (
      reminderCount === 0 &&
      createdAt <= oneDayAgo
    ) {
      return 1;
    }

    if (
      reminderCount === 1 &&
      createdAt <= threeDaysAgo
    ) {
      return 2;
    }

    if (
      reminderCount === 2 &&
      createdAt <= sevenDaysAgo
    ) {
      return 3;
    }

    return null;
  }

  async previewReminders() {
    const now =
      new Date();

    const oneDayAgo =
      new Date(
        now.getTime() -
          DAY,
      );

    const threeDaysAgo =
      new Date(
        now.getTime() -
          3 * DAY,
      );

    const sevenDaysAgo =
      new Date(
        now.getTime() -
          7 * DAY,
      );

    const users =
      await this.prisma.user.findMany({
        where: {
          status: 'ACTIVE',

          emailVerified: null,

          emailVerificationReminderCount: {
            lt: 3,
          },

          createdAt: {
            lte: oneDayAgo,
          },
        },

        orderBy: {
          createdAt: 'asc',
        },

        take: 200,

        select: {
          id: true,
          email: true,
          createdAt: true,

          emailVerificationReminderCount:
            true,

          emailVerificationReminderSentAt:
            true,
        },
      });

    return users
      .map((user) => {
        const nextReminder =
          this.determineNextReminder(
            user.emailVerificationReminderCount,
            user.createdAt,
            oneDayAgo,
            threeDaysAgo,
            sevenDaysAgo,
          );

        return {
          userId:
            user.id,

          email:
            user.email,

          createdAt:
            user.createdAt,

          currentReminderCount:
            user.emailVerificationReminderCount,

          lastReminderSentAt:
            user.emailVerificationReminderSentAt,

          nextReminder,
        };
      })
      .filter(
        (user) =>
          user.nextReminder !==
          null,
      );
  }

  async processReminders(
  onlyUserId?: string,
) {
    const now =
      new Date();

    const oneDayAgo =
      new Date(
        now.getTime() -
          DAY,
      );

    const threeDaysAgo =
      new Date(
        now.getTime() -
          3 * DAY,
      );

    const sevenDaysAgo =
      new Date(
        now.getTime() -
          7 * DAY,
      );

    const users =
      await this.prisma.user.findMany({
        where: {
            ...(onlyUserId
  ? {
      id: onlyUserId,
    }
  : {}),
          status: 'ACTIVE',

          emailVerified: null,

          emailVerificationReminderCount: {
            lt: 3,
          },

          createdAt: {
            lte: oneDayAgo,
          },
        },

        orderBy: {
          createdAt: 'asc',
        },

        take: 200,

        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,

          emailVerificationReminderCount:
            true,

          emailVerificationReminderSentAt:
            true,
        },
      });

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const user of users) {
      const targetReminder =
        this.determineNextReminder(
          user.emailVerificationReminderCount,
          user.createdAt,
          oneDayAgo,
          threeDaysAgo,
          sevenDaysAgo,
        );

      if (!targetReminder) {
        skipped += 1;
        continue;
      }

      const previousCount =
        user.emailVerificationReminderCount;

      const previousSentAt =
        user.emailVerificationReminderSentAt;

      const claimedAt =
        new Date();

      /*
       * Claim the reminder before sending it.
       *
       * Matching the current reminder count
       * prevents two concurrent job runs from
       * sending the same reminder.
       */
      const claim =
        await this.prisma.user.updateMany({
          where: {
            id: user.id,

            status:
              'ACTIVE',

            emailVerified:
              null,

            emailVerificationReminderCount:
              previousCount,
          },

          data: {
            emailVerificationReminderCount:
              targetReminder,

            emailVerificationReminderSentAt:
              claimedAt,
          },
        });

      if (
        claim.count !== 1
      ) {
        skipped += 1;
        continue;
      }

      try {
        await this.emailService
          .sendVerificationReminderEmail({
            to:
              user.email,

            name:
              user.name,

            reminderNumber:
              targetReminder,
          });

        sent += 1;

        this.logger.log(
          `Verification reminder ${targetReminder} sent for user ${user.id}`,
        );
      } catch (error) {
        failed += 1;

        /*
         * If email delivery fails, restore the
         * user's previous reminder state so the
         * reminder can be retried later.
         *
         * The claimed timestamp protects against
         * overwriting a newer state change.
         */
        await this.prisma.user.updateMany({
          where: {
            id:
              user.id,

            status:
              'ACTIVE',

            emailVerified:
              null,

            emailVerificationReminderCount:
              targetReminder,

            emailVerificationReminderSentAt:
              claimedAt,
          },

          data: {
            emailVerificationReminderCount:
              previousCount,

            emailVerificationReminderSentAt:
              previousSentAt,
          },
        });

        this.logger.error(
          `Verification reminder ${targetReminder} failed for user ${user.id}`,
          error instanceof Error
            ? error.stack
            : String(
                error,
              ),
        );
      }
    }

    return {
      processed:
        users.length,

      sent,

      failed,

      skipped,
    };
  }
}
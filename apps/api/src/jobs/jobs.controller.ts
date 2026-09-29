import {
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  EmailVerificationReminderService,
} from './email-verification-reminder.service.js';

@Controller('internal/jobs')
export class JobsController {
  constructor(
    private readonly configService:
      ConfigService,

    private readonly verificationReminderService:
      EmailVerificationReminderService,
  ) {}

  @Post(
  'email-verification-reminders',
)
runEmailVerificationReminders(
  @Headers('x-job-secret')
  suppliedSecret?: string,

  @Query('userId')
  userId?: string,
) {
    const expectedSecret =
      this.configService.get<string>(
        'INTERNAL_JOB_SECRET',
      );

    if (!expectedSecret) {
      throw new InternalServerErrorException(
        'Internal job authentication is not configured',
      );
    }

    if (
      !suppliedSecret ||
      suppliedSecret !==
        expectedSecret
    ) {
      throw new UnauthorizedException(
        'Unauthorized',
      );
    }

    return this.verificationReminderService
      .processReminders(

        userId,
      );
  }

  @Get(
  'email-verification-reminders/preview',
)
previewEmailVerificationReminders(
  @Headers('x-job-secret')
  suppliedSecret?: string,
) {
  const expectedSecret =
    this.configService.get<string>(
      'INTERNAL_JOB_SECRET',
    );

  if (!expectedSecret) {
    throw new InternalServerErrorException(
      'Internal job authentication is not configured',
    );
  }

  if (
    !suppliedSecret ||
    suppliedSecret !==
      expectedSecret
  ) {
    throw new UnauthorizedException(
      'Unauthorized',
    );
  }

  return this.verificationReminderService
    .previewReminders();
}
}
import {
  Module,
} from '@nestjs/common';

import {
  PrismaModule,
} from '../prisma.module.js';

import {
  EmailModule,
} from '../email/email.module.js';

import {
  JobsController,
} from './jobs.controller.js';

import {
  EmailVerificationReminderService,
} from './email-verification-reminder.service.js';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
  ],

  controllers: [
    JobsController,
  ],

  providers: [
    EmailVerificationReminderService,
  ],
})
export class JobsModule {}
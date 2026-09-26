import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PhoneVerificationService } from './phone-verification.service.js';

@Module({
  imports: [
    ConfigModule,
  ],

  providers: [
    PhoneVerificationService,
  ],

  exports: [
    PhoneVerificationService,
  ],
})
export class PhoneVerificationModule {}
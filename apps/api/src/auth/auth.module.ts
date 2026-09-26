import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../prisma.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { ApiAuthGuard } from './api-auth.guard.js';
import { EmailModule } from '../email/email.module.js';
import { PhoneVerificationModule } from '../phone-verification/phone-verification.module.js';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    PhoneVerificationModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('API_JWT_SECRET'),

        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, ApiAuthGuard],

  exports: [AuthService, ApiAuthGuard, JwtModule],
})
export class AuthModule {}

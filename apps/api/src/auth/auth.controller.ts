import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import type { Request } from 'express';

import { ApiAuthGuard } from './api-auth.guard.js';
import type { AuthUser } from './auth-user.type.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';

import { AuthService } from './auth.service.js';
import { VerifyCredentialsDto } from './dto/verify-credentials.dto.js';
import { SignupDto } from './dto/signup.dto.js';

import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { SendPhoneVerificationDto } from './dto/send-phone-verification.dto.js';
import { VerifyPhoneDto } from './dto/verify-phone.dto.js';

type AuthenticatedRequest = Request & {
  user: AuthUser;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('credentials')
  verifyCredentials(
    @Body()
    dto: VerifyCredentialsDto,
  ) {
    return this.authService.verifyCredentials(dto);
  }

  @Post('signup')
  signup(
    @Body()
    dto: SignupDto,
  ) {
    return this.authService.signup(dto);
  }

  @Post('invitations/accept')
  @UseGuards(ApiAuthGuard)
  acceptInvitation(
    @Body()
    dto: AcceptInvitationDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.authService.acceptInvitation(request.user.id, dto);
  }

@Post('verify-email')
verifyEmail(
  @Body()
  dto: VerifyEmailDto,
) {
  return this.authService.verifyEmail(dto);
}

@Post('resend-verification')
resendVerification(
  @Body()
  dto: ResendVerificationDto,
) {
  return this.authService.resendVerification(dto);
}

@Post('phone/send-code')
sendPhoneVerification(
  @Body()
  dto: SendPhoneVerificationDto,
) {
  return this.authService.sendPhoneVerification(
    dto,
  );
}

@Post('phone/resend')
resendPhoneVerification(
  @Body()
  dto: SendPhoneVerificationDto,
) {
  return this.authService.sendPhoneVerification(
    dto,
  );
}

@Post('phone/verify')
verifyPhone(
  @Body()
  dto: VerifyPhoneDto,
) {
  return this.authService.verifyPhone(
    dto,
  );
}
}

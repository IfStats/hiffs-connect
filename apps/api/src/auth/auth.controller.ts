import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { VerifyCredentialsDto } from './dto/verify-credentials.dto.js';

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
}

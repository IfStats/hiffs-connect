import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { createHmac, timingSafeEqual } from 'node:crypto';

import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class InfobipWebhookGuard
  implements CanActivate
{
  canActivate(
    context: ExecutionContext,
  ): boolean {
    const request =
      context
        .switchToHttp()
        .getRequest<
          RawBodyRequest<Request>
        >();

    const secret =
      process.env.INFOBIP_WEBHOOK_SECRET;

    if (!secret) {
      throw new UnauthorizedException(
        'Infobip webhook verification is not configured',
      );
    }

    const signatureHeader =
      request.headers[
        'x-hub-signature'
      ];

    const signature =
      Array.isArray(signatureHeader)
        ? signatureHeader[0]
        : signatureHeader;

    if (
      !signature ||
      !request.rawBody
    ) {
      throw new UnauthorizedException(
        'Missing Infobip webhook signature',
      );
    }

    const expected =
      createHmac(
        'sha256',
        secret,
      )
        .update(request.rawBody)
        .digest('hex');

    const receivedBuffer =
      Buffer.from(
        signature.trim(),
        'utf8',
      );

    const expectedBuffer =
      Buffer.from(
        expected,
        'utf8',
      );

    if (
      receivedBuffer.length !==
        expectedBuffer.length ||
      !timingSafeEqual(
        receivedBuffer,
        expectedBuffer,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid Infobip webhook signature',
      );
    }

    return true;
  }
}
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { timingSafeEqual } from 'node:crypto';

import type { Request } from 'express';

@Injectable()
export class RouteMobileWebhookGuard
  implements CanActivate
{
  canActivate(
    context: ExecutionContext,
  ): boolean {
    const request =
      context
        .switchToHttp()
        .getRequest<Request>();

    const expectedSecret =
      process.env.ROUTEMOBILE_WEBHOOK_SECRET;

    if (!expectedSecret) {
      throw new UnauthorizedException(
        'Route Mobile webhook verification is not configured',
      );
    }

    const headerValue =
      request.headers[
        'x-hiffs-webhook-secret'
      ];

    const headerSecret =
      Array.isArray(headerValue)
        ? headerValue[0]
        : headerValue;

    const querySecret =
      typeof request.query.secret === 'string'
        ? request.query.secret
        : undefined;

    const receivedSecret =
      headerSecret ?? querySecret;

    if (!receivedSecret) {
      throw new UnauthorizedException(
        'Missing Route Mobile webhook secret',
      );
    }

    const receivedBuffer =
      Buffer.from(receivedSecret);

    const expectedBuffer =
      Buffer.from(expectedSecret);

    if (
      receivedBuffer.length !==
        expectedBuffer.length ||
      !timingSafeEqual(
        receivedBuffer,
        expectedBuffer,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid Route Mobile webhook secret',
      );
    }

    return true;
  }
}
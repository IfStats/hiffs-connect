import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SendSmsDto } from '../dto/send-sms.dto.js';

import { MessagingProviderError } from './provider-error.js';

type RouteMobileResult = {
  code: string;
  destination?: string;
  messageId?: string;
};

@Injectable()
export class RouteMobileProvider {
  async sendSms(
    dto: SendSmsDto,
    sender: string,
  ) {
    const endpoint =
      process.env.ROUTEMOBILE_SMS_ENDPOINT;

    const username =
      process.env.ROUTEMOBILE_USERNAME;

    const password =
      process.env.ROUTEMOBILE_PASSWORD;

    if (!endpoint || !username || !password) {
      throw new InternalServerErrorException(
        'Route Mobile credentials are not configured',
      );
    }

    const params = new URLSearchParams({
      username,
      password,
      type: '0',
      dlr: '1',
      destination: dto.to.replace(/^\+/, ''),
      source: sender,
      message: dto.text,
    });

    const response = await fetch(
      `${endpoint}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Accept: 'text/plain',
        },
      },
    );

    const rawText = (await response.text()).trim();

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Route Mobile transport failure: HTTP ${response.status}`,
      );
    }

    const result =
      this.parseSingleResponse(rawText);

    if (result.code !== '1701') {
      this.throwPlatformError(
        result.code,
        rawText,
      );
    }

    if (!result.messageId) {
      throw new InternalServerErrorException(
        `Route Mobile accepted the request but returned no message ID: ${rawText}`,
      );
    }

    return {
      provider: 'routemobile',
      status: 'accepted',
      messageId: result.messageId,

      raw: {
        response: rawText,
        code: result.code,
        destination: result.destination,
      },
    };
  }

  private parseSingleResponse(
    response: string,
  ): RouteMobileResult {
    const firstEntry =
      response.split(',')[0]?.trim();

    if (!firstEntry) {
      throw new InternalServerErrorException(
        'Route Mobile returned an empty response',
      );
    }

    const [
      code,
      destination,
      messageId,
    ] = firstEntry.split('|');

    return {
      code: code?.trim() ?? '',
      destination: destination?.trim(),
      messageId: messageId?.trim(),
    };
  }

  private throwPlatformError(
  code: string,
  rawResponse: string,
): never {
  const errors: Record<string, string> = {
    '1702': 'Required parameter missing or invalid',
    '1703': 'Invalid Route Mobile username or password',
    '1704': 'Invalid SMS message type',
    '1705': 'Invalid message content',
    '1706': 'Invalid destination number',
    '1707': 'Invalid sender ID',
    '1708': 'Invalid delivery-report setting',
    '1709': 'Route Mobile user validation failed',
    '1710': 'Route Mobile internal error',
    '1025': 'Insufficient Route Mobile credit',
    '1715': 'Route Mobile response timeout',
  };

  const description =
    errors[code] ??
    `Unknown Route Mobile response code ${code}`;

  throw new MessagingProviderError(
    `${description}. Provider response: ${rawResponse}`,
    'routemobile',

    // Route Mobile explicitly permits retry only for 1709.
    code === '1709',

    code,
  );
}

  async downloadCoverageMap(): Promise<{
  data: Buffer;
  contentType: string;
}> {
  const username =
    process.env.ROUTEMOBILE_USERNAME;

  const password =
    process.env.ROUTEMOBILE_PASSWORD;

  if (!username || !password) {
    throw new InternalServerErrorException(
      'Route Mobile credentials are not configured',
    );
  }

  const params = new URLSearchParams({
    user: username,
    password,
  });

  const response = await fetch(
    `https://client.rmlconnect.net/routeDetailMail.php?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream',
      },
    },
  );

  if (!response.ok) {
    throw new InternalServerErrorException(
      `Route Mobile coverage-map request failed: HTTP ${response.status}`,
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const contentType =
    response.headers.get('content-type') ??
    'application/octet-stream';

  return {
    data: Buffer.from(arrayBuffer),
    contentType,
  };
}
}
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { MessagingProviderError } from './provider-error.js';

type SendSmsInput = {
  to: string;
  text: string;
};

type InfobipSmsResponse = {
  bulkId?: string;

  messages?: Array<{
    messageId?: string;
    status?: {
      groupId?: number;
      groupName?: string;
      id?: number;
      name?: string;
      description?: string;
    };
    destination?: string;
    details?: Record<string, unknown>;
  }>;

  requestError?: {
    serviceException?: {
      messageId?: string;
      text?: string;
    };
  };

  [key: string]: unknown;
};

@Injectable()
export class InfobipProvider {
  async sendSms(
    input: SendSmsInput,
    sender: string,
  ) {
    const mockMode =
      process.env.MESSAGING_MOCK_MODE ===
      'true';

    if (mockMode) {
      return {
        provider: 'mock',
        status: 'accepted',
        messageId: `mock-${Date.now()}`,
        raw: {
          to: input.to,
          sender,
          text: input.text,
        },
      };
    }

    const baseUrl =
      process.env.INFOBIP_BASE_URL;

    const apiKey =
      process.env.INFOBIP_API_KEY;

    const fallbackSender =
      process.env.INFOBIP_SMS_SENDER;

    if (!baseUrl || !apiKey) {
      throw new InternalServerErrorException(
        'Infobip credentials are not configured',
      );
    }

    const resolvedSender =
      sender ||
      fallbackSender ||
      'ServiceSMS';

    let response: Response;

    try {
      response = await fetch(
        `https://${baseUrl}/sms/3/messages`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `App ${apiKey}`,
            'Content-Type':
              'application/json',
            Accept:
              'application/json',
          },

          body: JSON.stringify({
            messages: [
              {
                sender:
                  resolvedSender,

                destinations: [
                  {
                    to: input.to,
                  },
                ],

                content: {
                  text: input.text,
                },
              },
            ],
          }),
        },
      );
    } catch (error) {
      throw new MessagingProviderError(
  error instanceof Error
    ? `Infobip network request failed: ${error.message}`
    : 'Infobip network request failed',
  'infobip',
  true,
  'INFOBIP_NETWORK_ERROR',
);
    }

    let data: InfobipSmsResponse;

    try {
      data =
        (await response.json()) as InfobipSmsResponse;
    } catch {
      throw new MessagingProviderError(
  'Infobip returned an invalid JSON response',
  'infobip',
  response.status >= 500,
  'INFOBIP_INVALID_RESPONSE',
);
    }

    if (!response.ok) {
      const providerMessage =
        data.requestError
          ?.serviceException
          ?.text;

      const retryable =
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;

      throw new MessagingProviderError(
  providerMessage ??
    `Infobip SMS request failed with HTTP ${response.status}`,
  'infobip',
  retryable,
  `INFOBIP_HTTP_${response.status}`,
);
    }

    const providerMessage =
      data.messages?.[0];

    const messageId =
      providerMessage?.messageId;

    if (!messageId) {
      throw new MessagingProviderError(
  'Infobip accepted the HTTP request but returned no messageId',
  'infobip',
  false,
  'INFOBIP_MISSING_MESSAGE_ID',
);
    }

    const providerStatus =
      providerMessage.status
        ?.groupName ??
      providerMessage.status
        ?.name ??
      'ACCEPTED';

    return {
      provider: 'infobip',
      status:
        providerStatus.toLowerCase(),
      messageId,
      raw: data,
    };
  }
}
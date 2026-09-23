import { Injectable, InternalServerErrorException } from '@nestjs/common';

type SendSmsInput = {
  to: string;
  text: string;
  sender?: string;
};

@Injectable()
export class InfobipProvider {
  async sendSms(input: SendSmsInput) {
    const mockMode = process.env.MESSAGING_MOCK_MODE === 'true';

    if (mockMode) {
      return {
        provider: 'mock',
        status: 'accepted',
        messageId: `mock-${Date.now()}`,
        to: input.to,
        sender: input.sender ?? 'HIFFS',
        text: input.text,
      };
    }

    const baseUrl = process.env.INFOBIP_BASE_URL;
    const apiKey = process.env.INFOBIP_API_KEY;
    const defaultSender = process.env.INFOBIP_SMS_SENDER;

    if (!baseUrl || !apiKey) {
      throw new InternalServerErrorException(
        'Infobip credentials are not configured',
      );
    }

    const response = await fetch(`https://${baseUrl}/sms/3/messages`, {
      method: 'POST',
      headers: {
        Authorization: `App ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            sender: input.sender ?? defaultSender ?? 'ServiceSMS',
            destinations: [{ to: input.to }],
            content: {
              text: input.text,
            },
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new InternalServerErrorException({
        message: 'Infobip SMS request failed',
        providerResponse: data,
      });
    }

    return data;
  }
}

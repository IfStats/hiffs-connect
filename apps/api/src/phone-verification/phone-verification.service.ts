import {
  BadGatewayException,
  Injectable,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

type InfobipSendPinResponse = {
  pinId?: string;
};

type InfobipVerifyPinResponse = {
  verified?: boolean;
  attemptsRemaining?: number;
};

@Injectable()
export class PhoneVerificationService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  private getBaseUrl() {
    const configured =
      this.configService.getOrThrow<string>(
        'INFOBIP_BASE_URL',
      );

    return configured.startsWith('http')
      ? configured.replace(/\/+$/, '')
      : `https://${configured.replace(/\/+$/, '')}`;
  }

  private getApiKey() {
    return this.configService.getOrThrow<string>(
      'INFOBIP_API_KEY',
    );
  }

  private async parseJson(
    response: Response,
  ): Promise<Record<string, unknown>> {
    try {
      return (await response.json()) as Record<
        string,
        unknown
      >;
    } catch {
      return {};
    }
  }

  async sendPin(phone: string) {
    const applicationId =
      this.configService.getOrThrow<string>(
        'INFOBIP_2FA_APPLICATION_ID',
      );

    const messageId =
      this.configService.getOrThrow<string>(
        'INFOBIP_2FA_MESSAGE_ID',
      );

    const sender =
      this.configService.get<string>(
        'INFOBIP_2FA_SENDER',
      );

    const destination =
      phone.replace(/^\+/, '');

    const body: Record<string, string> = {
      applicationId,
      messageId,
      to: destination,
    };

    if (sender?.trim()) {
      body.from = sender.trim();
    }

    let response: Response;

    try {
      response = await fetch(
        `${this.getBaseUrl()}/2fa/2/pin`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `App ${this.getApiKey()}`,

            'Content-Type':
              'application/json',

            Accept:
              'application/json',
          },

          body: JSON.stringify(body),
        },
      );
    } catch {
      throw new BadGatewayException(
        'Phone verification provider is unavailable',
      );
    }

    const payload =
      await this.parseJson(response);

    if (!response.ok) {
      throw new BadGatewayException(
        'Unable to send verification code',
      );
    }

    const typedPayload =
      payload as InfobipSendPinResponse;

    if (!typedPayload.pinId) {
      throw new BadGatewayException(
        'Verification provider did not return a PIN identifier',
      );
    }

    return {
      provider: 'infobip',
      pinId: typedPayload.pinId,
    };
  }

  async verifyPin(
    pinId: string,
    code: string,
  ) {
    let response: Response;

    try {
      response = await fetch(
        `${this.getBaseUrl()}/2fa/2/pin/${encodeURIComponent(
          pinId,
        )}/verify`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `App ${this.getApiKey()}`,

            'Content-Type':
              'application/json',

            Accept:
              'application/json',
          },

          body: JSON.stringify({
            pin: code,
          }),
        },
      );
    } catch {
      throw new BadGatewayException(
        'Phone verification provider is unavailable',
      );
    }

    const payload =
      await this.parseJson(response);

    if (!response.ok) {
      throw new BadGatewayException(
        'Unable to verify phone number',
      );
    }

    const typedPayload =
      payload as InfobipVerifyPinResponse;

    return {
      verified:
        typedPayload.verified === true,

      attemptsRemaining:
        typedPayload.attemptsRemaining ??
        null,
    };
  }
}
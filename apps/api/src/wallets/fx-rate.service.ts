import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  Prisma,
} from '@prisma/client';

type ExchangeRateApiSuccess = {
  result: 'success';
  base_code: string;
  target_code: string;
  conversion_rate: number;
  time_last_update_unix?: number;
};

type ExchangeRateApiError = {
  result: 'error';
  'error-type'?: string;
};

@Injectable()
export class FxRateService {
  async getRate(
    fromCurrency: string,
    toCurrency: string,
  ) {
    const apiKey =
      process.env.EXCHANGE_RATE_API_KEY
        ?.trim();

    if (!apiKey) {
      throw new InternalServerErrorException(
        'FX rate provider is not configured',
      );
    }

    const from =
      fromCurrency
        .trim()
        .toUpperCase();

    const to =
      toCurrency
        .trim()
        .toUpperCase();

    const url =
      `https://v6.exchangerate-api.com/v6/${encodeURIComponent(
        apiKey,
      )}/pair/${encodeURIComponent(
        from,
      )}/${encodeURIComponent(
        to,
      )}`;

    let response: Response;

    try {
      response =
        await fetch(
          url,
          {
            headers: {
              Accept:
                'application/json',
            },

            signal:
              AbortSignal.timeout(
                8000,
              ),
          },
        );
    } catch {
      throw new BadGatewayException(
        'Unable to reach FX rate provider',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'FX rate provider returned an invalid response',
      );
    }

    const payload =
      (await response.json()) as
        | ExchangeRateApiSuccess
        | ExchangeRateApiError;

    if (
      payload.result !==
      'success'
    ) {
      throw new BadGatewayException(
        `FX rate provider error: ${
          payload[
            'error-type'
          ] ??
          'unknown error'
        }`,
      );
    }

    if (
      !Number.isFinite(
        payload.conversion_rate,
      ) ||
      payload.conversion_rate <=
        0
    ) {
      throw new BadGatewayException(
        'FX provider returned an invalid exchange rate',
      );
    }

    const rate =
      new Prisma.Decimal(
        payload.conversion_rate.toString(),
      );

    return {
      rate,

      provider:
        'exchangerate-api',

      providerReference:
        payload.time_last_update_unix
          ? `${from}:${to}:${payload.time_last_update_unix}`
          : `${from}:${to}`,

      sourceUpdatedAt:
        payload.time_last_update_unix
          ? new Date(
              payload.time_last_update_unix *
                1000,
            )
          : null,
    };
  }
}
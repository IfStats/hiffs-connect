import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

type VerificationEmailInput = {
  to: string;
  name?: string | null;
  code: string;
};

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  private escapeHtml(
    value: string,
  ) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async sendVerificationEmail(
    input: VerificationEmailInput,
  ) {
    const apiKey =
      this.configService.get<string>(
        'RESEND_API_KEY',
      );

    const from =
      this.configService.get<string>(
        'EMAIL_FROM',
      );

    if (
      !apiKey ||
      !from
    ) {
      throw new InternalServerErrorException(
        'Transactional email is not configured',
      );
    }

    const resend =
      new Resend(apiKey);

    const name =
      input.name?.trim() ||
      'there';

    const safeName =
      this.escapeHtml(name);

    const {
      data,
      error,
    } = await resend.emails.send({
      from,

      to: [
        input.to,
      ],

      subject:
        `${input.code} is your Hiffs Connect verification code`,

      html: `
        <div
          style="
            font-family:Arial,sans-serif;
            max-width:600px;
            margin:0 auto;
            padding:32px;
            color:#0f172a;
          "
        >
          <div
            style="
              font-size:20px;
              font-weight:700;
              margin-bottom:24px;
            "
          >
            Hiffs Connect
          </div>

          <h1
            style="
              font-size:28px;
              margin-bottom:16px;
            "
          >
            Verify your email
          </h1>

          <p
            style="
              font-size:16px;
              line-height:1.6;
              color:#475569;
            "
          >
            Hi ${safeName},
          </p>

          <p
            style="
              font-size:16px;
              line-height:1.6;
              color:#475569;
            "
          >
            Enter this verification code
            to activate your Hiffs Connect
            account.
          </p>

          <div
            style="
              margin:32px 0;
              padding:20px;
              border-radius:12px;
              background:#f1f5f9;
              text-align:center;
            "
          >
            <div
              style="
                font-size:34px;
                font-weight:700;
                letter-spacing:8px;
                color:#0f172a;
              "
            >
              ${input.code}
            </div>
          </div>

          <p
            style="
              font-size:14px;
              line-height:1.6;
              color:#64748b;
            "
          >
            This code expires in
            10 minutes.
          </p>

          <p
            style="
              font-size:14px;
              line-height:1.6;
              color:#64748b;
            "
          >
            If you did not create a
            Hiffs Connect account,
            you can ignore this email.
          </p>

          <p
            style="
              margin-top:32px;
              font-size:12px;
              color:#94a3b8;
            "
          >
            Hiffs Connect ·
            Hiffs Global Enterprises
          </p>
        </div>
      `,

      text:
        `Hi ${name},\n\n` +
        `Your Hiffs Connect verification code is:\n\n` +
        `${input.code}\n\n` +
        `This code expires in 10 minutes.`,
    });

    if (error) {
      throw new InternalServerErrorException(
        `Verification email could not be sent: ${error.message}`,
      );
    }

    return {
      id:
        data?.id ??
        null,
    };
  }
}
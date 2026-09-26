import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

type VerificationEmailInput = {
  to: string;
  name?: string | null;
  token: string;
};

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

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

    const webAppUrl =
      (
        this.configService.get<string>(
          'WEB_APP_URL',
        ) ??
        'http://localhost:3000'
      ).replace(/\/$/, '');

    if (!apiKey || !from) {
      throw new InternalServerErrorException(
        'Transactional email is not configured',
      );
    }

    const resend =
      new Resend(apiKey);

    const verificationUrl =
      `${webAppUrl}/verify-email?token=${encodeURIComponent(
        input.token,
      )}`;

    const displayName =
      input.name?.trim() || 'there';

    const {
      data,
      error,
    } = await resend.emails.send({
      from,

      to: [input.to],

      subject:
        'Verify your Hiffs Connect account',

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
            Hi ${displayName},
          </p>

          <p
            style="
              font-size:16px;
              line-height:1.6;
              color:#475569;
            "
          >
            Confirm your email address to activate
            your Hiffs Connect account.
          </p>

          <div
            style="
              margin:32px 0;
            "
          >
            <a
              href="${verificationUrl}"
              style="
                display:inline-block;
                background:#2563eb;
                color:#ffffff;
                text-decoration:none;
                padding:14px 24px;
                border-radius:10px;
                font-weight:600;
              "
            >
              Verify email address
            </a>
          </div>

          <p
            style="
              font-size:14px;
              line-height:1.6;
              color:#64748b;
            "
          >
            This verification link expires in
            24 hours.
          </p>

          <p
            style="
              margin-top:32px;
              font-size:12px;
              color:#94a3b8;
            "
          >
            Hiffs Connect · Hiffs Global Enterprises
          </p>
        </div>
      `,

      text:
        `Hi ${displayName},\n\n` +
        `Verify your Hiffs Connect account:\n${verificationUrl}\n\n` +
        `This link expires in 24 hours.`,
    });

    if (error) {
      throw new InternalServerErrorException(
        `Verification email could not be sent: ${error.message}`,
      );
    }

    return {
      id: data?.id ?? null,
    };
  }
}
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiKeysService } from './api-keys.service.js';

export type ApiKeyRequest = Request & {
  apiKeyContext?: {
    apiKeyId: string;
    businessId: string;
  };
};

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiKeyRequest>();

    const header = request.headers['x-api-key'];

    const rawApiKey = Array.isArray(header) ? header[0] : header;

    if (!rawApiKey) {
      throw new UnauthorizedException('X-API-Key header is required');
    }

    const key = await this.apiKeysService.resolve(rawApiKey);

    if (!key) {
      throw new UnauthorizedException('Invalid, expired, or revoked API key');
    }

    request.apiKeyContext = {
      apiKeyId: key.id,
      businessId: key.businessId,
    };

    return true;
  }
}

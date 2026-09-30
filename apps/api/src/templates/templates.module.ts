import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module.js';

import {
  AuthzModule,
} from '../authz/authz.module.js';

import {
  PrismaModule,
} from '../prisma.module.js';

import {
  TemplatesController,
} from './templates.controller.js';

import {
  TemplatesService,
} from './templates.service.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuthzModule,
  ],

  controllers: [
    TemplatesController,
  ],

  providers: [
    TemplatesService,
  ],

  exports: [
    TemplatesService,
  ],
})
export class TemplatesModule {}
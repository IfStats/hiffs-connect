import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  TemplateStatus,
} from '@prisma/client';

import {
  ApiAuthGuard,
} from '../auth/api-auth.guard.js';

import {
  BusinessPermissionGuard,
} from '../authz/business-permission.guard.js';

import {
  Permission,
} from '../authz/permission.enum.js';

import {
  RequirePermissions,
} from '../authz/require-permissions.decorator.js';

import {
  CreateMessageTemplateDto,
} from './dto/create-message-template.dto.js';

import {
  UpdateMessageTemplateDto,
} from './dto/update-message-template.dto.js';

import {
  TemplatesService,
} from './templates.service.js';

@Controller(
  'businesses/:businessId/templates',
)
@UseGuards(
  ApiAuthGuard,
  BusinessPermissionGuard,
)
export class TemplatesController {
  constructor(
    private readonly templatesService:
      TemplatesService,
  ) {}

  @Post()
  @RequirePermissions(
    Permission.TEMPLATE_MANAGE,
  )
  create(
    @Param('businessId')
    businessId: string,

    @Body()
    dto:
      CreateMessageTemplateDto,
  ) {
    return this.templatesService.create(
      businessId,
      dto,
    );
  }

  @Get()
  @RequirePermissions(
    Permission.TEMPLATE_READ,
  )
  findAll(
    @Param('businessId')
    businessId: string,

    @Query('status')
    status?: TemplateStatus,
  ) {
    return this.templatesService.findAll(
      businessId,
      status,
    );
  }

  @Get(':templateId')
  @RequirePermissions(
    Permission.TEMPLATE_READ,
  )
  findOne(
    @Param('businessId')
    businessId: string,

    @Param('templateId')
    templateId: string,
  ) {
    return this.templatesService.findOne(
      businessId,
      templateId,
    );
  }

  @Patch(':templateId')
  @RequirePermissions(
    Permission.TEMPLATE_MANAGE,
  )
  update(
    @Param('businessId')
    businessId: string,

    @Param('templateId')
    templateId: string,

    @Body()
    dto:
      UpdateMessageTemplateDto,
  ) {
    return this.templatesService.update(
      businessId,
      templateId,
      dto,
    );
  }

  @Delete(':templateId')
  @RequirePermissions(
    Permission.TEMPLATE_MANAGE,
  )
  remove(
    @Param('businessId')
    businessId: string,

    @Param('templateId')
    templateId: string,
  ) {
    return this.templatesService.remove(
      businessId,
      templateId,
    );
  }
}
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApiAuthGuard } from '../auth/api-auth.guard.js';
import { PlatformPermissionGuard } from '../authz/platform-permission.guard.js';
import { Permission } from '../authz/permission.enum.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';

import { CreateRoutingRuleDto } from './dto/create-routing-rule.dto.js';
import { UpdateRoutingRuleDto } from './dto/update-routing-rule.dto.js';
import { RoutingService } from './routing.service.js';

@Controller('routing')
@UseGuards(
  ApiAuthGuard,
  PlatformPermissionGuard,
)
export class RoutingController {
  constructor(
    private readonly routingService: RoutingService,
  ) {}

  @Post()
  @RequirePermissions(
    Permission.ROUTING_MANAGE,
  )
  create(
    @Body()
    dto: CreateRoutingRuleDto,
  ) {
    return this.routingService.create(dto);
  }

  @Get()
  @RequirePermissions(
    Permission.ROUTING_READ,
  )
  findAll() {
    return this.routingService.findAll();
  }

  @Get(':id')
  @RequirePermissions(
    Permission.ROUTING_READ,
  )
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.routingService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(
    Permission.ROUTING_MANAGE,
  )
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateRoutingRuleDto,
  ) {
    return this.routingService.update(
      id,
      dto,
    );
  }
}
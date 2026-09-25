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

import { ContactStatus } from '@prisma/client';

import { ApiAuthGuard } from '../auth/api-auth.guard.js';
import { BusinessPermissionGuard } from '../authz/business-permission.guard.js';
import { Permission } from '../authz/permission.enum.js';
import { RequirePermissions } from '../authz/require-permissions.decorator.js';

import { ContactsService } from './contacts.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { UpdateContactDto } from './dto/update-contact.dto.js';

import { CreateContactGroupDto } from './dto/create-contact-group.dto.js';
import { UpdateContactGroupDto } from './dto/update-contact-group.dto.js';
import { ContactGroupMemberDto } from './dto/contact-group-member.dto.js';

import { ImportContactsDto } from './dto/import-contacts.dto.js';

@Controller('businesses/:businessId/contacts')
@UseGuards(
  ApiAuthGuard,
  BusinessPermissionGuard,
)
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
  ) {}

  @Post()
  @RequirePermissions(
    Permission.CONTACT_MANAGE,
  )
  create(
    @Param('businessId')
    businessId: string,

    @Body()
    dto: CreateContactDto,
  ) {
    return this.contactsService.create(
      businessId,
      dto,
    );
  }

  @Get()
  @RequirePermissions(
    Permission.CONTACT_READ,
  )
  findAll(
    @Param('businessId')
    businessId: string,

    @Query('groupId')
groupId?: string,

    @Query('search')
    search?: string,

    @Query('status')
    status?: ContactStatus,
  ) {
    return this.contactsService.findAll(
  businessId,
  search,
  status,
  groupId,
);
  }

  @Post('groups')
@RequirePermissions(
  Permission.CONTACT_MANAGE,
)
createGroup(
  @Param('businessId')
  businessId: string,

  @Body()
  dto: CreateContactGroupDto,
) {
  return this.contactsService.createGroup(
    businessId,
    dto,
  );
}

@Get('groups')
@RequirePermissions(
  Permission.CONTACT_READ,
)
findGroups(
  @Param('businessId')
  businessId: string,
) {
  return this.contactsService.findGroups(
    businessId,
  );
}

@Get('groups/:groupId')
@RequirePermissions(
  Permission.CONTACT_READ,
)
findGroup(
  @Param('businessId')
  businessId: string,

  @Param('groupId')
  groupId: string,
) {
  return this.contactsService.findGroup(
    businessId,
    groupId,
  );
}

@Patch('groups/:groupId')
@RequirePermissions(
  Permission.CONTACT_MANAGE,
)
updateGroup(
  @Param('businessId')
  businessId: string,

  @Param('groupId')
  groupId: string,

  @Body()
  dto: UpdateContactGroupDto,
) {
  return this.contactsService.updateGroup(
    businessId,
    groupId,
    dto,
  );
}

@Delete('groups/:groupId')
@RequirePermissions(
  Permission.CONTACT_MANAGE,
)
deleteGroup(
  @Param('businessId')
  businessId: string,

  @Param('groupId')
  groupId: string,
) {
  return this.contactsService.deleteGroup(
    businessId,
    groupId,
  );
}

@Post('groups/:groupId/members')
@RequirePermissions(
  Permission.CONTACT_MANAGE,
)
addContactToGroup(
  @Param('businessId')
  businessId: string,

  @Param('groupId')
  groupId: string,

  @Body()
  dto: ContactGroupMemberDto,
) {
  return this.contactsService.addContactToGroup(
    businessId,
    groupId,
    dto.contactId,
  );
}

@Delete(
  'groups/:groupId/members/:contactId',
)
@RequirePermissions(
  Permission.CONTACT_MANAGE,
)
removeContactFromGroup(
  @Param('businessId')
  businessId: string,

  @Param('groupId')
  groupId: string,

  @Param('contactId')
  contactId: string,
) {
  return this.contactsService.removeContactFromGroup(
    businessId,
    groupId,
    contactId,
  );
}

@Post('import')
@RequirePermissions(
  Permission.CONTACT_IMPORT,
)
importContacts(
  @Param('businessId')
  businessId: string,

  @Body()
  dto: ImportContactsDto,
) {
  return this.contactsService.importContacts(
    businessId,
    dto,
  );
}

  @Get(':contactId')
  @RequirePermissions(
    Permission.CONTACT_READ,
  )
  findOne(
    @Param('businessId')
    businessId: string,

    @Param('contactId')
    contactId: string,
  ) {
    return this.contactsService.findOne(
      businessId,
      contactId,
    );
  }

  @Patch(':contactId')
  @RequirePermissions(
    Permission.CONTACT_MANAGE,
  )
  update(
    @Param('businessId')
    businessId: string,

    @Param('contactId')
    contactId: string,

    @Body()
    dto: UpdateContactDto,
  ) {
    return this.contactsService.update(
      businessId,
      contactId,
      dto,
    );
  }

  @Delete(':contactId')
  @RequirePermissions(
    Permission.CONTACT_MANAGE,
  )
  remove(
    @Param('businessId')
    businessId: string,

    @Param('contactId')
    contactId: string,
  ) {
    return this.contactsService.remove(
      businessId,
      contactId,
    );
  }
}
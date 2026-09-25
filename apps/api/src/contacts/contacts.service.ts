import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ContactStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma.service.js';

import { CreateContactDto } from './dto/create-contact.dto.js';
import { UpdateContactDto } from './dto/update-contact.dto.js';

import { ImportContactsDto } from './dto/import-contacts.dto.js';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    businessId: string,
    dto: CreateContactDto,
  ) {
    try {
      return await this.prisma.contact.create({
        data: {
          businessId,
          firstName:
            dto.firstName?.trim() || null,
          lastName:
            dto.lastName?.trim() || null,
          displayName:
            dto.displayName?.trim() || null,
          phone: dto.phone.trim(),
          email:
            dto.email?.trim().toLowerCase() ||
            null,
          status:
            dto.status ??
            ContactStatus.ACTIVE,
          source:
            dto.source?.trim() || null,
          metadata:
            dto.metadata
              ? (
                  dto.metadata as Prisma.InputJsonValue
                )
              : undefined,
        },
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A contact with this phone number already exists in this business',
        );
      }

      throw error;
    }
  }

  async findAll(
  businessId: string,
  search?: string,
  status?: ContactStatus,
  groupId?: string,
) {
    const normalizedSearch =
      search?.trim();

    return this.prisma.contact.findMany({
      where: {
        businessId,

        ...(status
          ? {
              status,
            }
          : {}),

          ...(groupId
  ? {
      groups: {
        some: {
          groupId,
        },
      },
    }
  : {}),

        ...(normalizedSearch
          ? {
              OR: [
                {
                  firstName: {
                    contains:
                      normalizedSearch,
                    mode: 'insensitive',
                  },
                },

                {
                  lastName: {
                    contains:
                      normalizedSearch,
                    mode: 'insensitive',
                  },
                },

                {
                  displayName: {
                    contains:
                      normalizedSearch,
                    mode: 'insensitive',
                  },
                },

                {
                  phone: {
                    contains:
                      normalizedSearch,
                  },
                },

                {
                  email: {
                    contains:
                      normalizedSearch,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },

      include: {
        groups: {
          include: {
            group: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 250,
    });
  }

  async findOne(
    businessId: string,
    contactId: string,
  ) {
    const contact =
      await this.prisma.contact.findFirst({
        where: {
          id: contactId,
          businessId,
        },

        include: {
          groups: {
            include: {
              group: true,
            },
          },
        },
      });

    if (!contact) {
      throw new NotFoundException(
        'Contact not found',
      );
    }

    return contact;
  }

  async update(
    businessId: string,
    contactId: string,
    dto: UpdateContactDto,
  ) {
    await this.findOne(
      businessId,
      contactId,
    );

    try {
      return await this.prisma.contact.update({
        where: {
          id: contactId,
        },

        data: {
          ...(dto.firstName !==
          undefined
            ? {
                firstName:
                  dto.firstName.trim() ||
                  null,
              }
            : {}),

          ...(dto.lastName !== undefined
            ? {
                lastName:
                  dto.lastName.trim() ||
                  null,
              }
            : {}),

          ...(dto.displayName !==
          undefined
            ? {
                displayName:
                  dto.displayName.trim() ||
                  null,
              }
            : {}),

          ...(dto.phone !== undefined
            ? {
                phone:
                  dto.phone.trim(),
              }
            : {}),

          ...(dto.email !== undefined
            ? {
                email:
                  dto.email
                    .trim()
                    .toLowerCase() ||
                  null,
              }
            : {}),

          ...(dto.status !== undefined
            ? {
                status: dto.status,
              }
            : {}),

          ...(dto.source !== undefined
            ? {
                source:
                  dto.source.trim() ||
                  null,
              }
            : {}),

          ...(dto.metadata !== undefined
            ? {
                metadata:
                  dto.metadata as Prisma.InputJsonValue,
              }
            : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A contact with this phone number already exists in this business',
        );
      }

      throw error;
    }
  }

  async remove(
    businessId: string,
    contactId: string,
  ) {
    await this.findOne(
      businessId,
      contactId,
    );

    await this.prisma.contact.delete({
      where: {
        id: contactId,
      },
    });

    return {
      id: contactId,
      deleted: true,
    };
  }

  async createGroup(
  businessId: string,
  dto: {
    name: string;
    description?: string;
  },
) {
  try {
    return await this.prisma.contactGroup.create({
      data: {
        businessId,
        name: dto.name.trim(),
        description:
          dto.description?.trim() || null,
      },
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A contact group with this name already exists',
      );
    }

    throw error;
  }
}

findGroups(
  businessId: string,
) {
  return this.prisma.contactGroup.findMany({
    where: {
      businessId,
    },

    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },

    orderBy: {
      name: 'asc',
    },
  });
}

async findGroup(
  businessId: string,
  groupId: string,
) {
  const group =
    await this.prisma.contactGroup.findFirst({
      where: {
        id: groupId,
        businessId,
      },

      include: {
        members: {
          include: {
            contact: true,
          },

          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

  if (!group) {
    throw new NotFoundException(
      'Contact group not found',
    );
  }

  return group;
}

async updateGroup(
  businessId: string,
  groupId: string,
  dto: {
    name?: string;
    description?: string;
  },
) {
  await this.findGroup(
    businessId,
    groupId,
  );

  try {
    return await this.prisma.contactGroup.update({
      where: {
        id: groupId,
      },

      data: {
        ...(dto.name !== undefined
          ? {
              name: dto.name.trim(),
            }
          : {}),

        ...(dto.description !== undefined
          ? {
              description:
                dto.description.trim() ||
                null,
            }
          : {}),
      },
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A contact group with this name already exists',
      );
    }

    throw error;
  }
}

async deleteGroup(
  businessId: string,
  groupId: string,
) {
  await this.findGroup(
    businessId,
    groupId,
  );

  await this.prisma.contactGroup.delete({
    where: {
      id: groupId,
    },
  });

  return {
    id: groupId,
    deleted: true,
  };
}

async addContactToGroup(
  businessId: string,
  groupId: string,
  contactId: string,
) {
  await this.findGroup(
    businessId,
    groupId,
  );

  await this.findOne(
    businessId,
    contactId,
  );

  try {
    return await this.prisma.contactGroupMember.create({
      data: {
        groupId,
        contactId,
      },

      include: {
        contact: true,
        group: true,
      },
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Contact is already in this group',
      );
    }

    throw error;
  }
}

async removeContactFromGroup(
  businessId: string,
  groupId: string,
  contactId: string,
) {
  await this.findGroup(
    businessId,
    groupId,
  );

  const membership =
    await this.prisma.contactGroupMember.findFirst({
      where: {
        groupId,
        contactId,

        group: {
          businessId,
        },

        contact: {
          businessId,
        },
      },
    });

  if (!membership) {
    throw new NotFoundException(
      'Contact group membership not found',
    );
  }

  await this.prisma.contactGroupMember.delete({
    where: {
      id: membership.id,
    },
  });

  return {
    id: membership.id,
    removed: true,
  };
}

async importContacts(
  businessId: string,
  dto: ImportContactsDto,
) {
  const summary = {
    total: dto.contacts.length,
    created: 0,
    skipped: 0,
    invalid: 0,
    suppressed: 0,
    duplicatesInFile: 0,
  };

  const seenPhones =
    new Set<string>();

  const rows = [];

  for (const row of dto.contacts) {
    const phone =
      row.phone.trim();

    if (
      !/^\+[1-9]\d{7,14}$/.test(
        phone,
      )
    ) {
      summary.invalid += 1;
      continue;
    }

    if (
      seenPhones.has(phone)
    ) {
      summary.duplicatesInFile += 1;
      summary.skipped += 1;
      continue;
    }

    seenPhones.add(phone);

    rows.push({
      ...row,
      phone,
    });
  }

  if (rows.length === 0) {
    return summary;
  }

  const existingContacts =
    await this.prisma.contact.findMany({
      where: {
        businessId,

        phone: {
          in: rows.map(
            (row) => row.phone,
          ),
        },
      },

      select: {
        phone: true,
        status: true,
      },
    });

  const existingByPhone =
    new Map(
      existingContacts.map(
        (contact) => [
          contact.phone,
          contact.status,
        ],
      ),
    );

  for (const row of rows) {
    const existingStatus =
      existingByPhone.get(
        row.phone,
      );

    if (existingStatus) {
      summary.skipped += 1;

      if (
        existingStatus ===
          'UNSUBSCRIBED' ||
        existingStatus ===
          'BLOCKED'
      ) {
        summary.suppressed += 1;
      }

      continue;
    }

    try {
      await this.prisma.contact.create({
        data: {
          businessId,

          phone:
            row.phone,

          firstName:
            row.firstName?.trim() ||
            null,

          lastName:
            row.lastName?.trim() ||
            null,

          displayName:
            row.displayName?.trim() ||
            null,

          email:
            row.email
              ?.trim()
              .toLowerCase() ||
            null,

          source:
            row.source?.trim() ||
            'CSV_IMPORT',

          status: 'ACTIVE',
        },
      });

      summary.created += 1;
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        summary.skipped += 1;
        continue;
      }

      throw error;
    }
  }

  return summary;
}
}
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  MessageChannel,
  Prisma,
  TemplateStatus,
} from '@prisma/client';

import {
  PrismaService,
} from '../prisma.service.js';

import {
  CreateMessageTemplateDto,
} from './dto/create-message-template.dto.js';

import {
  UpdateMessageTemplateDto,
} from './dto/update-message-template.dto.js';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private extractVariables(
    content: string,
  ): string[] {
    const variables =
      new Set<string>();

    const pattern =
      /{{\s*([A-Za-z_][A-Za-z0-9_]*)\s*}}/g;

    let match:
      | RegExpExecArray
      | null;

    while (
      (match =
        pattern.exec(
          content,
        )) !== null
    ) {
      variables.add(
        match[1],
      );
    }

    return [
      ...variables,
    ];
  }

  private validateContent(
    channel: MessageChannel,
    content: string,
  ) {
    const trimmed =
      content.trim();

    if (!trimmed) {
      throw new BadRequestException(
        'Template content is required',
      );
    }

    if (
      channel ===
        MessageChannel.SMS &&
      trimmed.length > 1600
    ) {
      throw new BadRequestException(
        'SMS template content cannot exceed 1600 characters',
      );
    }

    return trimmed;
  }

  async create(
    businessId: string,
    dto: CreateMessageTemplateDto,
  ) {
    const channel =
      dto.channel ??
      MessageChannel.SMS;

    const content =
      this.validateContent(
        channel,
        dto.content,
      );

    const name =
      dto.name.trim();

    if (!name) {
      throw new BadRequestException(
        'Template name is required',
      );
    }

    try {
      return await this.prisma.messageTemplate.create({
        data: {
          businessId,

          name,

          channel,

          content,

          variables:
            this.extractVariables(
              content,
            ),
        },
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code ===
          'P2002'
      ) {
        throw new ConflictException(
          'A template with this name already exists',
        );
      }

      throw error;
    }
  }

  findAll(
    businessId: string,
    status?: TemplateStatus,
  ) {
    return this.prisma.messageTemplate.findMany({
      where: {
        businessId,

        ...(status
          ? {
              status,
            }
          : {}),
      },

      orderBy: {
        updatedAt:
          'desc',
      },
    });
  }

  async findOne(
    businessId: string,
    templateId: string,
  ) {
    const template =
      await this.prisma.messageTemplate.findFirst({
        where: {
          id:
            templateId,

          businessId,
        },
      });

    if (!template) {
      throw new NotFoundException(
        'Template not found',
      );
    }

    return template;
  }

  async update(
    businessId: string,
    templateId: string,
    dto: UpdateMessageTemplateDto,
  ) {
    const existing =
      await this.findOne(
        businessId,
        templateId,
      );

    const channel =
      dto.channel ??
      existing.channel;

    const content =
      dto.content !==
      undefined
        ? this.validateContent(
            channel,
            dto.content,
          )
        : existing.content;

    const name =
      dto.name !==
      undefined
        ? dto.name.trim()
        : existing.name;

    if (!name) {
      throw new BadRequestException(
        'Template name is required',
      );
    }

    try {
      return await this.prisma.messageTemplate.update({
        where: {
          id:
            templateId,
        },

        data: {
          name,

          channel,

          content,

          variables:
            this.extractVariables(
              content,
            ),

          ...(dto.status !==
          undefined
            ? {
                status:
                  dto.status,
              }
            : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code ===
          'P2002'
      ) {
        throw new ConflictException(
          'A template with this name already exists',
        );
      }

      throw error;
    }
  }

  async remove(
    businessId: string,
    templateId: string,
  ) {
    await this.findOne(
      businessId,
      templateId,
    );

    await this.prisma.messageTemplate.delete({
      where: {
        id:
          templateId,
      },
    });

    return {
      id:
        templateId,

      deleted: true,
    };
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateBusinessDto } from './dto/create-business.dto.js';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateBusinessDto) {
    return this.prisma.business.create({
      data: {
        name: dto.name,
        countryCode: dto.countryCode.toUpperCase(),
        website: dto.website,
        email: dto.email,
        phone: dto.phone,
      },
    });
  }

  findAll() {
    return this.prisma.business.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        senderRequests: true,
      },
    });
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        senderRequests: true,
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }
}
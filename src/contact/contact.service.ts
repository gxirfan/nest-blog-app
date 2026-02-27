import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContactMessageEntity } from './entities/contact-message.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import slugify from 'slugify';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  private async createUniqueSlug(title: string): Promise<string> {
    let baseSlug = slugify(title, { lower: true, strict: true });
    if (!baseSlug || baseSlug.trim() === '') baseSlug = 'censored-title';
    let slug = baseSlug;

    while (true) {
      const existing = await this.prisma.contactMessage.findUnique({
        where: { slug },
      });
      if (!existing) break;
      const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
      slug = `${baseSlug}-${randomSuffix}`;
    }
    return slug;
  }

  async handleContactSubmission(
    data: CreateContactDto,
  ): Promise<ContactMessageEntity> {
    const slug = await this.createUniqueSlug(data.subject);
    return this.prisma.contactMessage.create({
      data: {
        ...data,
        slug,
      },
    });
  }

  async findAll(): Promise<ContactMessageEntity[]> {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllPaginated(
    paginationQueryDto: PaginationQueryDto,
  ): Promise<IPaginationResponse<ContactMessageEntity>> {
    const { page = 1, limit = 10 } = paginationQueryDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.contactMessage.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneById(id: number): Promise<ContactMessageEntity> {
    const message = await this.prisma.contactMessage.findUnique({
      where: { id },
    });
    if (!message) throw new NotFoundException('Contact message not found');
    return message;
  }

  async findOneBySlug(slug: string): Promise<ContactMessageEntity> {
    try {
      return await this.prisma.contactMessage.update({
        where: { slug },
        data: { isRead: true },
      });
    } catch (e) {
      throw new NotFoundException('Contact message not found');
    }
  }

  async update(
    id: number,
    data: CreateContactDto,
  ): Promise<ContactMessageEntity> {
    try {
      return await this.prisma.contactMessage.update({
        where: { id },
        data,
      });
    } catch (e) {
      throw new NotFoundException('Contact message not found');
    }
  }

  async delete(id: number): Promise<ContactMessageEntity> {
    try {
      return await this.prisma.contactMessage.delete({
        where: { id },
      });
    } catch (e) {
      throw new NotFoundException('Contact message not found');
    }
  }
}

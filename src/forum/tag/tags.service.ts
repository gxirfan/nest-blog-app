import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UserService } from 'src/user/user.service';
import { UpdateTagDto } from './dto/update-tag.dto';
import slugify from 'slugify';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TagEntity } from './entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  private async createUniqueSlug(title: string): Promise<string> {
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;

    while (true) {
      const existingTag = await this.prisma.tag.findUnique({
        where: { slug },
      });

      if (!existingTag) break;

      const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
      slug = `${baseSlug}-${randomSuffix}`;
    }

    return slug;
  }

  async createTag(
    userId: number,
    createTagDto: CreateTagDto,
  ): Promise<TagEntity> {
    const user = await this.userService.findOneById(Number(userId));
    if (!user) throw new NotFoundException('User not found');

    const slug = await this.createUniqueSlug(createTagDto.title);

    try {
      return await this.prisma.tag.create({
        data: {
          title: createTagDto.title,
          description: createTagDto.description,
          slug: slug,
          userId: Number(userId),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Tag could not be created.');
    }
  }

  async findAllStatusTrue(): Promise<{ id: number }[]> {
    return await this.prisma.tag.findMany({
      where: { status: true },
      select: { id: true },
    });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<TagEntity>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        where: { status: true },
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              username: true,
              role: true,
              nickname: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tag.count({ where: { status: true } }),
    ]);

    return {
      data: tags,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByUserIdPaginated(
    userId: number,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<TagEntity>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        where: { userId },
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              username: true,
              role: true,
              nickname: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tag.count({ where: { userId } }),
    ]);

    return {
      data: tags,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByUserIdForLibraryMyTagsPaginated(
    userId: number,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<TagEntity>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        where: { userId },
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              username: true,
              role: true,
              nickname: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tag.count({ where: { userId } }),
    ]);

    return {
      data: tags,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAll(): Promise<TagEntity[]> {
    return await this.prisma.tag.findMany({
      include: {
        user: {
          select: {
            username: true,
            role: true,
            nickname: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneBySlug(userId: number | null, slug: string): Promise<TagEntity> {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            username: true,
            role: true,
            nickname: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!tag) throw new NotFoundException('Tag not found');

    const user = userId
      ? await this.userService.findOneById(Number(userId))
      : null;

    if (
      user &&
      (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR)
    ) {
      return tag;
    }

    if (tag.status === false && tag.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to view this tag',
      );
    }

    return tag;
  }

  async findOneByIdAsDocument(id: number): Promise<TagEntity> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            username: true,
            role: true,
            nickname: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!tag) throw new NotFoundException('Tag not found');

    return tag;
  }

  async updateOneById(
    id: number,
    currentUserId: number,
    updateTagDto: UpdateTagDto,
  ): Promise<TagEntity> {
    const tag = await this.prisma.tag.findFirst({
      where: { id, userId: currentUserId },
    });

    if (!tag) throw new NotFoundException('Tag not found or unauthorized');

    let newSlug = tag.slug;
    if (updateTagDto.title && updateTagDto.title !== tag.title) {
      newSlug = await this.createUniqueSlug(updateTagDto.title);
    }

    return await this.prisma.tag.update({
      where: { id },
      data: {
        ...updateTagDto,
        slug: newSlug,
      },
    });
  }

  async updateOneByIdAsAdmin(
    id: number,
    updateTagDto: UpdateTagDto,
  ): Promise<TagEntity> {
    try {
      return await this.prisma.tag.update({
        where: { id },
        data: updateTagDto,
      });
    } catch (e) {
      throw new NotFoundException('Tag not found');
    }
  }

  async deleteOneById(id: number): Promise<TagEntity> {
    try {
      return await this.prisma.tag.delete({
        where: { id },
      });
    } catch (e) {
      throw new NotFoundException('Tag not found');
    }
  }
}

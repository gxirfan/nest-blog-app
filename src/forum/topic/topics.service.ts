import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, Prisma } from '@prisma/client';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UserService } from 'src/user/user.service';
import { TagsService } from 'src/forum/tag/tags.service';
import slugify from 'slugify';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TopicEntity } from './entities/topic.entity';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';

@Injectable()
export class TopicsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly tagService: TagsService,
  ) {}

  private async createUniqueSlug(title: string): Promise<string> {
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;

    while (true) {
      const existing = await this.prisma.topic.findUnique({ where: { slug } });
      if (!existing) break;
      const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
      slug = `${baseSlug}-${randomSuffix}`;
    }
    return slug;
  }

  async updateLastPostAt(topicId: number): Promise<void> {
    await this.prisma.topic.update({
      where: { id: topicId },
      data: { lastPostAt: new Date() },
    });
  }

  async updatePostCount(topicId: number, postCount: number): Promise<void> {
    await this.prisma.topic.update({
      where: { id: topicId },
      data: { postCount },
    });
  }

  async createTopic(
    currentUserId: number,
    createTopicDto: CreateTopicDto,
  ): Promise<TopicEntity> {
    const tag = await this.tagService.findOneByIdAsDocument(
      createTopicDto.tagId,
    );
    if (!tag) throw new NotFoundException('Tag not found');

    const slug = await this.createUniqueSlug(createTopicDto.title);

    try {
      return await this.prisma.topic.create({
        data: {
          title: createTopicDto.title,
          content: createTopicDto.content,
          slug,
          userId: currentUserId,
          tagId: tag.id,
        },
        include: {
          user: {
            select: {
              username: true,
              nickname: true,
              avatar: true,
              role: true,
            },
          },
          tag: { select: { title: true, slug: true } },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A topic with this slug already exists');
      }
      console.error('Topic create error:', error);
      throw error;
    }
  }

  public async incrementViewCount(
    topicId: number,
    clientIdentifier: string,
  ): Promise<void> {
    const cacheKey = `VIEWED_TOPIC_${topicId}_${clientIdentifier}`;
    const viewed = await this.cacheManager.get(cacheKey);

    if (viewed) return;

    await this.prisma.topic.update({
      where: { id: topicId },
      data: { viewCount: { increment: 1 } },
    });

    await this.cacheManager.set(cacheKey, '1', 86400);
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<TopicEntity>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        where: { tag: { status: true } },
        include: {
          user: {
            select: {
              username: true,
              nickname: true,
              avatar: true,
              role: true,
            },
          },
          tag: {
            select: {
              title: true,
              description: true,
              slug: true,
              status: true,
            },
          },
        },
        orderBy: { lastPostAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.topic.count({ where: { tag: { status: true } } }),
    ]);

    return {
      data: topics,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByTagIdPaginated(
    tagId: number,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<TopicEntity>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        where: { tagId, status: true, tag: { status: true } },
        include: {
          user: { select: { username: true, nickname: true, avatar: true } },
          tag: true,
        },
        orderBy: { lastPostAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.topic.count({
        where: { tagId, status: true, tag: { status: true } },
      }),
    ]);

    return {
      data: topics,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneBySlug(
    userId: number | null,
    slug: string,
  ): Promise<TopicEntity> {
    const topic = await this.prisma.topic.findUnique({
      where: { slug },
      include: {
        user: {
          select: { username: true, nickname: true, avatar: true, role: true },
        },
        tag: true,
      },
    });

    if (!topic) throw new NotFoundException('Topic not found');

    if (userId) {
      const user = await this.userService.findOneById(userId);
      if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR)
        return topic;
    }

    if (!topic.status && topic.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this topic.',
      );
    }

    return topic;
  }

  async findAll(): Promise<TopicEntity[]> {
    return await this.prisma.topic.findMany({
      include: {
        user: {
          select: {
            username: true,
            nickname: true,
            firstName: true,
            lastName: true,
            bio: true,
            role: true,
            avatar: true,
          },
        },
        tag: { select: { title: true, description: true, slug: true } },
      },
      orderBy: { lastPostAt: 'desc' },
    });
  }

  async findOneByTagId(tagId: number): Promise<TopicEntity> {
    const topic = await this.prisma.topic.findFirst({
      where: { tagId: Number(tagId) },
      include: {
        user: { select: { username: true, nickname: true, avatar: true } },
        tag: { select: { title: true, description: true, slug: true } },
      },
      orderBy: { lastPostAt: 'desc' },
    });
    if (!topic) throw new NotFoundException('Topic not found');
    return topic;
  }

  async findAllByUserIdForLibraryMyTopicsPaginated(
    userId: number,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<TopicEntity>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        where: { userId: Number(userId) },
        include: {
          user: { select: { username: true, nickname: true, avatar: true } },
          tag: {
            select: {
              title: true,
              description: true,
              slug: true,
              status: true,
            },
          },
        },
        orderBy: { lastPostAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.topic.count({ where: { userId: Number(userId) } }),
    ]);

    return {
      data: topics,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateOneById(
    id: number,
    currentUserId: number,
    updateTopicDto: UpdateTopicDto,
  ): Promise<TopicEntity> {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new NotFoundException('Topic not found');

    const user = await this.userService.findOneById(currentUserId);

    const isOwner = topic.userId === currentUserId;
    const isAuthorized =
      user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR;

    if (!isOwner && !isAuthorized) {
      throw new ForbiddenException(
        'You do not have permission to update this topic.',
      );
    }

    let slug = topic.slug;
    if (updateTopicDto.title && updateTopicDto.title !== topic.title) {
      slug = await this.createUniqueSlug(updateTopicDto.title);
    }

    return await this.prisma.topic.update({
      where: { id },
      data: { ...updateTopicDto, slug },
    });
  }

  async updateOneByIdAsAdmin(
    id: number,
    updateTopicDto: UpdateTopicDto,
  ): Promise<TopicEntity> {
    try {
      const updatedTopic = await this.prisma.topic.update({
        where: { id },
        data: updateTopicDto,
      });

      return updatedTopic;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Topic not found');
      }
      throw error;
    }
  }

  async deleteOneById(id: number): Promise<TopicEntity> {
    try {
      return await this.prisma.topic.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException('Topic not found');
    }
  }

  async findOneById(id: number): Promise<TopicEntity> {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: { user: true, tag: true },
    });
    if (!topic) throw new NotFoundException('Topic not found');
    return topic;
  }
}

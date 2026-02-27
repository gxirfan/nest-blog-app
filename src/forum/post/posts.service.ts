import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import slugify from 'slugify';
import { UserService } from 'src/user/user.service';
import { TopicsService } from 'src/forum/topic/topics.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ReplyCreatedEvent } from 'src/notification/events/notification.events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import * as cheerio from 'cheerio';
import { join } from 'path';
import * as fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { PostEntity } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly topicService: TopicsService,
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache,
    private eventEmitter: EventEmitter2,
  ) {}

  private async createUniqueSlug(title: string): Promise<string> {
    let baseSlug = slugify(title, { lower: true, strict: true });
    if (!baseSlug || baseSlug.trim() === '') baseSlug = 'censored-title';
    let slug = baseSlug;

    while (true) {
      const existing = await this.prisma.post.findUnique({ where: { slug } });
      if (!existing) break;
      const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
      slug = `${baseSlug}-${randomSuffix}`;
    }
    return slug;
  }

  private async updateLastPostAt(postId: number) {
    await this.prisma.post.update({
      where: { id: postId },
      data: { lastPostAt: new Date() },
    });
  }

  private async updatePostCount(postId: number) {
    const count = await this.prisma.post.count({
      where: { parentId: postId, status: true },
    });
    await this.prisma.post.update({
      where: { id: postId },
      data: { postCount: count },
    });
  }

  private async processImagesInContent(content: string): Promise<string> {
    const $ = cheerio.load(content);
    const images = $('img');
    if (images.length === 0) return content;

    const uploadPath = join(process.cwd(), 'public', 'uploads', 'posts');
    await fs.ensureDir(uploadPath);

    for (let i = 0; i < images.length; i++) {
      const src = $(images[i]).attr('src');
      if (src && src.startsWith('data:image')) {
        const fileName = `${uuidv4()}.webp`;
        const filePath = join(uploadPath, fileName);
        const base64Data = src.replace(/^data:image\/\w+;base64,/, '');
        await fs.writeFile(filePath, base64Data, 'base64');
        const publicUrl = `/uploads/posts/${fileName}`;
        $(images[i]).attr('src', publicUrl);
      }
    }
    return $.html();
  }

  private saveBase64Image(
    base64Data: string,
    subFolder: string,
  ): string | null {
    if (!base64Data) return null;
    const urlRegex = /^(https?:\/\/[^\s]+)\//;
    const match = base64Data.match(urlRegex);
    const apiUrl = match ? match[1] : 'http://localhost:3000/';

    if (!base64Data.startsWith('data:image')) {
      return base64Data.includes(apiUrl)
        ? base64Data.replace(apiUrl, '')
        : base64Data;
    }

    const mimeType = base64Data.match(
      /data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/,
    )?.[1];
    const extension = mimeType?.split('/')[1] || 'jpg';
    const base64Image = base64Data.split(';base64,').pop();
    if (!base64Image) return null;

    const uploadDir = join(process.cwd(), 'public', 'uploads', subFolder);
    if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

    const fileName = `${uuidv4()}.${extension}`;
    const filePath = join(uploadDir, fileName);
    writeFileSync(filePath, Buffer.from(base64Image, 'base64'));

    return `/uploads/${subFolder}/${fileName}`;
  }

  private calculateReadingTime(content: string): number {
    if (!content) return 0;
    const plainText = content.replace(/<[^>]*>/g, '');
    const words = plainText.trim().split(/\s+/).length;
    return Math.ceil(words / 200);
  }

  async createPost(userId: number, createPostDto: CreatePostDto) {
    const { mainImage, ...otherFields } = createPostDto;
    const content = await this.processImagesInContent(createPostDto.content);
    const parentId = createPostDto.parentId
      ? Number(createPostDto.parentId)
      : null;
    const topicId = Number(createPostDto.topicId);

    const post = await this.prisma.post.create({
      data: {
        ...otherFields,
        userId,
        topicId,
        parentId,
        slug: await this.createUniqueSlug(createPostDto.title),
        content,
        readingTime: this.calculateReadingTime(content),
        mainImage: mainImage
          ? this.saveBase64Image(mainImage, 'postCovers') || undefined
          : undefined,
      },
    });

    await this.topicService.updateLastPostAt(topicId);

    if (post.topicId) {
      await this.updateLastPostAt(post.topicId);
      await this.updatePostCount(post.topicId);
      const count = await this.countDocumentsByTopicId(post.topicId);
      await this.topicService.updateLastPostAt(post.topicId);
      await this.topicService.updatePostCount(post.topicId, count);
    }

    if (post.parentId) {
      await this.updateLastPostAt(post.parentId);
      await this.updatePostCount(post.parentId);

      const parentPost = await this.prisma.post.findUnique({
        where: { id: post.parentId },
      });
      const replier = await this.userService.findOneById(userId);

      if (parentPost) {
        this.eventEmitter.emit(
          'post.reply',
          new ReplyCreatedEvent(
            parentPost.id,
            parentPost.title,
            parentPost.slug,
            post.id,
            post.slug,
            userId,
            replier.username,
            replier.nickname,
            parentPost.userId,
          ),
        );
      }
    }

    return post;
  }

  public async incrementViewCount(
    postId: number,
    clientIdentifier: string,
  ): Promise<void> {
    const cacheKey = `VIEWED_POST_${postId}_${clientIdentifier}`;
    const viewed = await this.cacheManager.get(cacheKey);
    if (viewed) return;

    await this.prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });

    await this.cacheManager.set(cacheKey, '1', 86400);
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostEntity>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { status: true, topic: { status: true } },
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
          topic: { select: { title: true, slug: true, tagId: true } },
          parent: { select: { title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.post.count({
        where: { status: true, topic: { status: true } },
      }),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByViewCountPaginated(
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostEntity>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { status: true, topic: { status: true } },
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
          topic: { select: { title: true, slug: true, tagId: true } },
          parent: { select: { title: true, slug: true } },
        },
        orderBy: { viewCount: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.post.count({
        where: { status: true, topic: { status: true } },
      }),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAll(): Promise<PostEntity[]> {
    return this.prisma.post.findMany({
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
        topic: { select: { title: true, slug: true, tagId: true } },
        parent: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countDocumentsByTopicId(topicId: number): Promise<number> {
    return this.prisma.post.count({ where: { topicId, status: true } });
  }

  async findAllByUserId(userId: number): Promise<PostEntity[]> {
    return this.prisma.post.findMany({
      where: { userId },
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
        topic: { select: { title: true, slug: true, tagId: true } },
        parent: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByUserIdPaginated(
    userId: number,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostEntity>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { userId, status: true, topic: { status: true } },
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
          topic: { select: { title: true, slug: true, tagId: true } },
          parent: { select: { title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.post.count({
        where: { userId, status: true, topic: { status: true } },
      }),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByUsernamePaginated(
    username: string,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostEntity>> {
    const user = await this.userService.findOneByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    return this.findAllByUserIdPaginated(user.id, query);
  }

  async findAllByTopicIdPaginated(
    topicId: number,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostEntity>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          topicId,
          status: true,
          parentId: null,
          topic: { status: true },
        },
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
          topic: { select: { title: true, slug: true, tagId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.post.count({
        where: {
          topicId,
          status: true,
          parentId: null,
          topic: { status: true },
        },
      }),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByParentIdPaginated(
    parentId: number,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostEntity>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { parentId, status: true, topic: { status: true } },
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
          topic: { select: { title: true, slug: true, tagId: true } },
          parent: { select: { title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.post.count({
        where: { parentId, status: true, topic: { status: true } },
      }),
    ]);
    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByUserIdForLibraryMyPostsPaginated(
    userId: number,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostEntity>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { userId },
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
          topic: { select: { title: true, slug: true, tagId: true } },
          parent: { select: { title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.post.count({ where: { userId } }),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number): Promise<PostEntity> {
    const post = await this.prisma.post.findUnique({
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
        topic: { select: { title: true, slug: true, tagId: true } },
        parent: { select: { title: true, slug: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async findOneBySlug(
    userId: number | null,
    slug: string,
  ): Promise<PostEntity> {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            nickname: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        topic: true,
        parent: { select: { title: true, slug: true } },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    const user = userId ? await this.userService.findOneById(userId) : null;

    if (
      user &&
      (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR)
    )
      return post;

    if (
      post.topic.status === false &&
      post.topic.userId !== userId &&
      post.status === false &&
      post.userId !== userId
    ) {
      throw new UnauthorizedException(
        'You are not authorized to view this post',
      );
    }

    return post;
  }

  async update(
    id: number,
    userId: number,
    updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    const post = await this.findOne(id);
    const user = await this.userService.findOneById(userId);

    const canUpdate =
      user.role === UserRole.ADMIN ||
      user.role === UserRole.MODERATOR ||
      post.userId === userId;
    if (!canUpdate) throw new UnauthorizedException('You are not authorized');

    let newSlug = post.slug;
    if (updatePostDto.title && updatePostDto.title !== post.title) {
      newSlug = await this.createUniqueSlug(updatePostDto.title);
    }

    let content = post.content;
    let readingTime = post.readingTime;
    if (updatePostDto.content) {
      content = await this.processImagesInContent(updatePostDto.content);
      readingTime = this.calculateReadingTime(content);
    }

    const mainImage = updatePostDto.mainImage
      ? this.saveBase64Image(updatePostDto.mainImage, 'postCovers') ||
        post.mainImage
      : post.mainImage;

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        ...updatePostDto,
        slug: newSlug,
        content,
        readingTime,
        mainImage,
      },
    });

    this.updatePostCount(post.id).catch((err) =>
      console.error('Post count update failed:', err),
    );
    return updatedPost;
  }

  async updateTotalScores(
    postId: number,
    score: number,
    upvotes: number,
    downvotes: number,
  ): Promise<PostEntity> {
    return this.prisma.post.update({
      where: { id: postId },
      data: { score, upvotes, downvotes },
    });
  }

  async updateOneByIdAsAdmin(
    id: number,
    updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    try {
      return await this.prisma.post.update({
        where: { id },
        data: updatePostDto,
      });
    } catch (e) {
      throw new NotFoundException('Post not found');
    }
  }

  async delete(id: number): Promise<PostEntity> {
    try {
      return await this.prisma.post.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException('Post not found');
    }
  }
}

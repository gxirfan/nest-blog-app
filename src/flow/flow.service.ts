import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateFlowDto } from './dto/create-flow.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { IPaginationResponse } from '../common/interfaces/pagination-response.interface';
import slugify from 'slugify';
import { FlowRepliedEvent } from 'src/notification/events/notification.events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { UserService } from 'src/user/user.service';
import { FlowEntity } from './entities/flow.entity';

@Injectable()
export class FlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async createUniqueSlug(content: string): Promise<string> {
    let baseSlug = slugify(content.substring(0, 30), {
      lower: true,
      strict: true,
    });
    if (!baseSlug || baseSlug.trim() === '') baseSlug = 'censored-content';
    let slug = baseSlug;

    while (true) {
      const existing = await this.prisma.flow.findUnique({ where: { slug } });
      if (!existing) break;
      const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
      slug = `${baseSlug}-${randomSuffix}`;
    }
    return slug;
  }

  private async updateReplyCount(
    flowId: number,
    increment: number,
  ): Promise<void> {
    await this.prisma.flow.update({
      where: { id: flowId },
      data: { replyCount: { increment } },
    });
  }

  async create(userId: number, createFlowDto: CreateFlowDto) {
    if (!createFlowDto.content || createFlowDto.content.trim() === '') {
      throw new BadRequestException('Flow content cannot be empty.');
    }

    const slug = await this.createUniqueSlug(createFlowDto.content);
    const parentId = createFlowDto.parentId
      ? Number(createFlowDto.parentId)
      : null;

    const createdFlow = await this.prisma.flow.create({
      data: {
        content: createFlowDto.content.trim(),
        slug,
        authorId: userId,
        parentId: parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (parentId) {
      await this.updateReplyCount(parentId, 1);
      const parentFlow = await this.prisma.flow.findUnique({
        where: { id: parentId },
        include: { author: true },
      });

      if (parentFlow && parentFlow.authorId !== userId) {
        this.eventEmitter.emit(
          'flow.replied',
          new FlowRepliedEvent(
            userId,
            createdFlow.author.nickname,
            parentFlow.authorId,
            parentFlow.content.substring(0, 30),
            createdFlow.slug,
            createdFlow.id,
          ),
        );
      }
    }

    return createdFlow;
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<FlowEntity>> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.flow.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          author: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
              role: true,
            },
          },
          parent: { select: { content: true, slug: true } },
        },
      }),
      this.prisma.flow.count({ where: { isDeleted: false } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string) {
    const flow = await this.prisma.flow.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            role: true,
          },
        },
        parent: { select: { content: true, slug: true } },
      },
    });

    if (!flow || flow.isDeleted) throw new NotFoundException('Flow not found');
    return flow;
  }

  async findReplies(
    parentId: number,
    queryDto: PaginationQueryDto,
  ): Promise<IPaginationResponse<FlowEntity>> {
    const { page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.flow.findMany({
        where: { parentId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          author: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
              role: true,
            },
          },
          parent: { select: { content: true, slug: true } },
        },
      }),
      this.prisma.flow.count({ where: { parentId, isDeleted: false } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateBySlug(slug: string, updateFlowDto: UpdateFlowDto) {
    const existingFlow = await this.prisma.flow.findUnique({ where: { slug } });
    if (!existingFlow || existingFlow.isDeleted)
      throw new NotFoundException('Flow not found');

    const updateData: Prisma.FlowUpdateInput = { ...(updateFlowDto as any) };

    if (updateFlowDto.isDeleted === true && existingFlow.isDeleted === false) {
      if (existingFlow.parentId)
        await this.updateReplyCount(existingFlow.parentId, -1);
    }

    if (
      updateFlowDto.content &&
      updateFlowDto.content !== existingFlow.content
    ) {
      updateData.slug = await this.createUniqueSlug(updateFlowDto.content);
    }

    return this.prisma.flow.update({
      where: { slug },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            role: true,
          },
        },
        parent: { select: { content: true, slug: true } },
      },
    });
  }

  async findByUsername(
    username: string,
    queryDto: PaginationQueryDto,
  ): Promise<IPaginationResponse<FlowEntity>> {
    const { page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;
    const user = await this.userService.findOneByUsername(username);

    const [data, total] = await Promise.all([
      this.prisma.flow.findMany({
        where: { authorId: user.id, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          author: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
              role: true,
            },
          },
          parent: { select: { content: true, slug: true } },
        },
      }),
      this.prisma.flow.count({
        where: { authorId: user.id, isDeleted: false },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByUserIdForLibraryMyFlowPostsPaginated(
    userId: number,
    queryDto: PaginationQueryDto,
  ): Promise<IPaginationResponse<FlowEntity>> {
    const { page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.flow.findMany({
        where: { authorId: userId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          author: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
              role: true,
            },
          },
          parent: { select: { content: true, slug: true } },
        },
      }),
      this.prisma.flow.count({ where: { authorId: userId, isDeleted: false } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}

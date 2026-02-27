import { Injectable } from '@nestjs/common';
import { EntityType } from '@prisma/client';
import { PostsService } from '../post/posts.service';
import { UserService } from '../../user/user.service';
import { GetVoteStatusDto } from './dtos/get-vote-status.dto';
import { CreateVoteDto } from './dtos/create-vote.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VoteCreatedEvent } from 'src/notification/events/notification.events';
import { PrismaService } from 'src/prisma/prisma.service';
import { VoteEntity } from './entities/vote.entity';

@Injectable()
export class VoteService {
  constructor(
    private prisma: PrismaService,
    private postService: PostsService,
    private userService: UserService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findOneByUser(
    userId: number,
    queryDto: GetVoteStatusDto,
  ): Promise<VoteEntity | null> {
    const { postId, type } = queryDto;
    const formattedType = type.toUpperCase() as EntityType;
    return this.prisma.vote.findUnique({
      where: {
        userId_postId_type: {
          userId,
          postId: Number(postId),
          type: formattedType,
        },
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
        post: {
          select: {
            title: true,
            content: true,
            slug: true,
          },
        },
      },
    });
  }

  async findUserVotedPostList(userId: number): Promise<VoteEntity[]> {
    return this.prisma.vote.findMany({
      where: {
        userId,
        type: EntityType.POST as unknown as EntityType,
      },
      include: {
        post: {
          select: { title: true, slug: true, content: true, score: true },
        },
        user: {
          select: { username: true, nickname: true },
        },
      },
    });
  }

  async createVote(
    userId: number,
    voteDto: CreateVoteDto,
  ): Promise<VoteEntity | null> {
    const { postId, type, direction } = voteDto;
    const pId = Number(postId);
    const formattedType = type.toUpperCase() as EntityType;
    const existingVote = await this.prisma.vote.findUnique({
      where: {
        userId_postId_type: {
          userId,
          postId: pId,
          type: formattedType,
        },
      },
    });

    let result: VoteEntity | null = null;

    if (
      existingVote &&
      (existingVote.direction === direction || direction === 0)
    ) {
      await this.prisma.vote.delete({
        where: { id: existingVote.id },
      });
      result = null;
    } else {
      result = await this.prisma.vote.upsert({
        where: {
          userId_postId_type: {
            userId,
            postId: pId,
            type: formattedType,
          },
        },
        update: { direction },
        create: {
          userId,
          postId: pId,
          type: formattedType,
          direction,
        },
      });
    }

    if (result) {
      const post = await this.postService.findOne(pId);
      const voter = await this.userService.findOneById(userId);
      if (post) {
        this.eventEmitter.emit(
          'vote.created',
          new VoteCreatedEvent(
            post.id,
            post.title,
            post.slug,
            userId,
            voter.username,
            voter.nickname,
            direction,
            post.userId,
          ),
        );
      }
    }

    await this.updateEntityTotalScores(pId, formattedType);

    return result;
  }

  async updateEntityTotalScores(
    postId: number,
    type: EntityType,
  ): Promise<void> {
    const stats = await this.prisma.vote.groupBy({
      by: ['postId', 'type'],
      where: { postId, type },
      _sum: { direction: true },
      _count: { _all: true },
    });

    const [upvotes, downvotes] = await Promise.all([
      this.prisma.vote.count({ where: { postId, type, direction: 1 } }),
      this.prisma.vote.count({ where: { postId, type, direction: -1 } }),
    ]);

    const score = stats[0]?._sum?.direction || 0;

    await this.postService.updateTotalScores(postId, score, upvotes, downvotes);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType, Notification, Prisma } from '@prisma/client';
import {
  VoteCreatedEvent,
  ReplyCreatedEvent,
  FlowRepliedEvent,
  UserFollowedEvent,
} from './events/notification.events';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { NotificationEntity } from './entities/notification.entity';

const SENDER_INCLUDE = {
  sender: {
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true,
    },
  },
};

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('vote.created')
  async handleVoteCreated(payload: VoteCreatedEvent) {
    const voterId = Number(payload.voterId);
    const ownerId = Number(payload.postOwnerId);

    if (voterId === ownerId) return;

    const isUpvote = payload.direction === 1;
    const type = isUpvote
      ? NotificationType.VOTE_UP
      : NotificationType.VOTE_DOWN;
    const action = isUpvote ? 'upvoted' : 'downvoted';

    await this.createNotification({
      recipientId: ownerId,
      senderId: voterId,
      type,
      message: `@${payload.voterNickname} ${action} your entry: "${payload.postTitle.substring(0, 30)}..."`,
      targetUrl: payload.postSlug,
      relatedPostId: Number(payload.postId),
    });
  }

  @OnEvent('post.reply')
  async handleReplyCreated(payload: ReplyCreatedEvent) {
    const replierId = Number(payload.replierId);
    const ownerId = Number(payload.postOwnerId);

    if (replierId === ownerId) return;

    await this.createNotification({
      recipientId: ownerId,
      senderId: replierId,
      type: NotificationType.POST_REPLY,
      message: `@${payload.replierNickname} replied to your entry: "${payload.parentPostTitle.substring(0, 30)}..."`,
      targetUrl: payload.replySlug,
      relatedPostId: Number(payload.parentPostId),
    });
  }

  @OnEvent('flow.replied')
  async handleFlowReplied(payload: FlowRepliedEvent) {
    await this.createNotification({
      recipientId: Number(payload.recipientId),
      senderId: Number(payload.replierId),
      type: NotificationType.FLOW_REPLY,
      message: `${payload.replierNickname} replied to your thread: "${payload.parentContent.substring(0, 30)}..."`,
      targetUrl: payload.replySlug,
      relatedPostId: Number(payload.replyId),
    });
  }

  @OnEvent('user.followed')
  async handleUserFollowed(payload: UserFollowedEvent) {
    await this.createNotification({
      recipientId: Number(payload.followingId),
      senderId: Number(payload.followerId),
      type: NotificationType.FOLLOW,
      message: `${payload.followerNickname} started following you`,
      targetUrl: `/user/${payload.followerUsername}`,
    });
  }

  private async createNotification(
    data: Prisma.NotificationUncheckedCreateInput,
  ): Promise<NotificationEntity> {
    return this.prisma.notification.create({ data });
  }

  async getUserNotifications(
    userId: number,
  ): Promise<IPaginationResponse<NotificationEntity>> {
    const [data, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientId: userId, isRead: false },
        orderBy: { createdAt: 'desc' },
        include: SENDER_INCLUDE,
      }),
      this.prisma.notification.count({
        where: { recipientId: userId, isRead: false },
      }),
    ]);

    return {
      data,
      meta: { total: unreadCount, page: 1, limit: data.length, totalPages: 1 },
    };
  }

  async getUserNotificationsPaginated(
    userId: number,
    queryDto: PaginationQueryDto,
  ): Promise<IPaginationResponse<NotificationEntity>> {
    const { page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: SENDER_INCLUDE,
      }),
      this.prisma.notification.count({ where: { recipientId: userId } }),
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

  async markAsRead(
    notificationId: number,
    userId: number,
  ): Promise<NotificationEntity> {
    try {
      return await this.prisma.notification.update({
        where: { id: notificationId, recipientId: userId },
        data: { isRead: true },
        include: SENDER_INCLUDE,
      });
    } catch (error) {
      throw new NotFoundException('Notification not found or unauthorized.');
    }
  }

  async markAllAsRead(userId: number): Promise<NotificationEntity[]> {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });

    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      include: SENDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }
}

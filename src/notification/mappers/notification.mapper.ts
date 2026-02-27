import { Notification } from '@prisma/client';
import { NotificationResponseDto } from '../dto/notification.response.dto';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { UserEntity } from 'src/user/entities/user.entity';

export type PrismaNotification = Notification & {
  sender?: Partial<UserEntity>;
};

export class NotificationMapper {
  public static toResponseDto(
    raw: PrismaNotification,
  ): NotificationResponseDto {
    if (!raw) return null as any;
    const sender = raw.sender;

    return {
      id: raw.id,
      senderId: raw.senderId,
      senderUsername: sender?.username ?? '',
      senderNickname: sender?.nickname ?? '',
      senderAvatar: sender?.avatar ?? '',
      recipientId: raw.recipientId,
      type: raw.type,
      message: raw.message,
      targetUrl: raw.targetUrl,
      relatedPostId: raw.relatedPostId ?? 0,
      isRead: raw.isRead,
      createdAt: raw.createdAt instanceof Date ? raw.createdAt : new Date(),
      updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt : new Date(),
    };
  }

  public static toArrayResponseDto(
    items: PrismaNotification[],
  ): NotificationResponseDto[] {
    if (!items) return [];
    return items.map((item) => this.toResponseDto(item));
  }

  public static toPaginatedResponseDto(
    source: IPaginationResponse<PrismaNotification>,
  ): IPaginationResponse<NotificationResponseDto> {
    return {
      data: this.toArrayResponseDto(source.data),
      meta: source.meta,
    };
  }
}

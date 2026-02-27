import { IAuditFields } from 'src/common/interfaces/common.interface';

export class NotificationResponseDto implements IAuditFields {
  id: number;
  senderId: number;
  senderUsername: string;
  senderNickname: string;
  senderAvatar: string;
  recipientId: number;
  type: string;
  message: string;
  targetUrl: string;
  relatedPostId: number;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

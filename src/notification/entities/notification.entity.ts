import { Notification, NotificationType } from '@prisma/client';
import { IAuditFields } from 'src/common/interfaces/common.interface';

export class NotificationEntity implements Notification, IAuditFields {
  id: number;
  recipientId: number;
  senderId: number;
  type: NotificationType;
  message: string;
  targetUrl: string;
  relatedPostId: number | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  recipientId: number;
  senderId: number;
  type: string;
  message: string;
  targetUrl: string;
  relatedPostId: number;
  isRead: boolean;
}

import { ContactMessage } from '@prisma/client';
import { IAuditFields } from 'src/common/interfaces/common.interface';

export class ContactMessageEntity implements ContactMessage, IAuditFields {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  slug: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

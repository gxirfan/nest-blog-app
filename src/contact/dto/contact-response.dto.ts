import { IAuditFields } from 'src/common/interfaces/common.interface';

export class ContactResponseDto implements IAuditFields {
  id: number;
  name: string;
  email: string;
  subject: string;
  slug: string | null;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

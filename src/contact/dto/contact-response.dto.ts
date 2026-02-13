import { IAuditFields } from 'src/common/interfaces/common.interface';

export class ContactResponseDto implements IAuditFields {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

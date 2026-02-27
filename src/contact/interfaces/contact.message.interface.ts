import { IAuditFields } from 'src/common/interfaces/common.interface';

export interface IContactMessage extends IAuditFields {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  slug: string;
  isRead: boolean;
}

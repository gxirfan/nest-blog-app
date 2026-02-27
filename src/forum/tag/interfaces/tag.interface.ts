import { IAuditFields } from 'src/common/interfaces/common.interface';

export interface ITag extends IAuditFields {
  id: number;
  title: string;
  description: string;
  slug: string;
  userId: number;
  status: boolean;
}

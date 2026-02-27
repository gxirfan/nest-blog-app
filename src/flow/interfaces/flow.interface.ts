import { IAuditFields } from 'src/common/interfaces/common.interface';

export interface IFlow extends IAuditFields {
  id: number;
  content: string;
  author: number;
  slug: string;
  parentId: number | null;
  replyCount: number;
  isDeleted: boolean;
}

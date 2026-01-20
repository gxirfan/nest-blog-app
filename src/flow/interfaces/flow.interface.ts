import { IAuditFields } from 'src/common/interfaces/common.interface';

export interface IFlow extends IAuditFields {
  content: string;
  author: string;
  slug: string;
  parentId: string | null;
  replyCount: number;
  isDeleted: boolean;
}

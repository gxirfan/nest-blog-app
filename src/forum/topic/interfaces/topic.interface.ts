import { IAuditFields } from 'src/common/interfaces/common.interface';

export interface ITopic extends IAuditFields {
  id: number;
  title: string;
  slug: string;
  content: string;
  tagId: number;
  userId: number;
  viewCount: number;
  postCount: number;
  status: boolean;
}

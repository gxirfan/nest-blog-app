import { IAuditFields } from 'src/common/interfaces/common.interface';

export interface IPost extends IAuditFields {
  title: string;
  mainImage?: string | null;
  content: string;
  userId: number;
  topicId: number;
  slug: string;
  lastPostAt: Date | null;
  viewCount: number;
  status: boolean;
  parentId: number | null;
  upvotes?: number;
  downvotes?: number;
  score?: number;
  readingTime: number;
}

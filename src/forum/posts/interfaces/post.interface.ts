import { IAuditFields } from 'src/common/interfaces/common.interface';

export interface IPost extends IAuditFields {
  title: string;
  mainImage?: string | null;
  content: string;
  userId: string;
  topicId: string;
  slug: string;
  lastPostAt: Date | null;
  viewCount: number;
  status: boolean;
  parentId: string | null;
  upvotes?: number;
  downvotes?: number;
  score?: number;
  readingTime: number;
}

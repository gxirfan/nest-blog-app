import { Post } from '@prisma/client';
import { IAuditFields } from 'src/common/interfaces/common.interface';

export class PostEntity implements Post, IAuditFields {
  id: number;
  title: string;
  slug: string;
  mainImage: string | null;
  content: string;
  postCount: number;
  lastPostAt: Date | null;
  viewCount: number;
  status: boolean;
  readingTime: number;
  score: number;
  upvotes: number;
  downvotes: number;
  userId: number;
  topicId: number;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

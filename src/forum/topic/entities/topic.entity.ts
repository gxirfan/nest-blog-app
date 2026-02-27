import { IAuditFields } from 'src/common/interfaces/common.interface';
import { Topic } from '@prisma/client';

export class TopicEntity implements Topic, IAuditFields {
  id: number;
  title: string;
  content: string;
  slug: string;
  postCount: number;
  lastPostAt: Date;
  viewCount: number;
  status: boolean;
  userId: number;
  tagId: number;
  createdAt: Date;
  updatedAt: Date;
}

import { Flow } from '@prisma/client';
import { IAuditFields } from 'src/common/interfaces/common.interface';

export class FlowEntity implements Flow, IAuditFields {
  id: number;
  slug: string;
  content: string;
  replyCount: number;
  isDeleted: boolean;
  authorId: number;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

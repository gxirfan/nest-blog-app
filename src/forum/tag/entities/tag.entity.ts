import { Tag } from '@prisma/client';
import { IAuditFields } from 'src/common/interfaces/common.interface';

export class TagEntity implements Tag, IAuditFields {
  id: number;
  title: string;
  description: string;
  slug: string;
  status: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

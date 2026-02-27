import { EntityType, Vote } from '@prisma/client';
import { IAuditFields } from 'src/common/interfaces/common.interface';

export class VoteEntity implements Vote, IAuditFields {
  id: number;
  direction: number;
  type: EntityType;
  userId: number;
  postId: number;
  createdAt: Date;
  updatedAt: Date;
}

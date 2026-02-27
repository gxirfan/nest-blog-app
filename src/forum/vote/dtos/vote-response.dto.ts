import { IAuditFields } from 'src/common/interfaces/common.interface';

export class VoteResponseDto implements IAuditFields {
  id: number;
  userId: number;
  username: string;
  nickname: string;

  postId: number;
  title: string;
  content: string;
  slug: string;
  type: string;

  direction: number;
  createdAt: Date;
  updatedAt: Date;
}

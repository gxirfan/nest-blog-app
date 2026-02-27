import { IAuditFields } from 'src/common/interfaces/common.interface';
export class FlowResponseDto implements IAuditFields {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    nickname: string;
    role: string;
    avatar?: string | null;
  };
  parentId?: number | null;
  parentContent?: string | null;
  parentSlug?: string | null;
  slug: string;
  replyCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

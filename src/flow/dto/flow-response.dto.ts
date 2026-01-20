import { IAuditFields } from 'src/common/interfaces/common.interface';
export class FlowResponseDto implements IAuditFields {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    nickname: string;
    role: string;
    avatar?: string;
  };
  parentId?: string;
  parentContent?: string;
  parentSlug?: string;
  slug: string;
  replyCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

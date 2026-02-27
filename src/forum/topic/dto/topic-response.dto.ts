import { IAuditFields } from 'src/common/interfaces/common.interface';

export class TopicResponseDto implements IAuditFields {
  id: number;
  title: string;
  slug: string;
  content: string;
  tagId: number;
  tagTitle: string;
  tagSlug: string;
  tagDescription: string;
  userId: number;
  author: string;
  authorAvatar: string;
  authorUsername: string;
  authorNickname: string;
  authorBio: string;
  authorRole: string;

  viewCount: number;

  lastPostAt: Date;
  postCount: number;
  status: boolean;

  createdAt: Date;
  updatedAt: Date;
}

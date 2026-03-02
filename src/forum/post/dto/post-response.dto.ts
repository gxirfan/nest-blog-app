import { IAuditFields } from 'src/common/interfaces/common.interface';

export class PostResponseDto implements IAuditFields {
  id: number;
  title: string;
  slug: string;
  seoTags: string[];
  mainImage: string | null;
  content: string;
  score: number;

  userId: number;
  author: string;
  authorNickname: string;
  authorBio: string;
  authorRole: string;
  authorUsername: string;
  authorAvatar: string | null;

  topicId: number;
  topicTitle: string;
  topicSlug: string;
  topicTagId: number;

  parentId?: number;
  parentTitle?: string;
  parentSlug?: string;
  parentContent?: string;
  postCount?: number;
  viewCount: number;
  readingTime: number;

  lastPostAt?: Date;

  parentUserId?: number;
  parentAuthor?: string;
  parentAuthorUsername?: string;
  parentAuthorNickname?: string;
  parentAuthorBio?: string;
  parentAuthorRole?: string;
  parentAuthorAvatar?: string | null;
  status: boolean;

  createdAt: Date;
  updatedAt: Date;
}

import { PostEntity } from '../entities/post.entity';
import { PostResponseDto } from '../dto/post-response.dto';
import { TopicEntity } from 'src/forum/topic/entities/topic.entity';
import { UserEntity } from 'src/user/entities/user.entity';

export type PostWithRelations = PostEntity & {
  user?: Partial<UserEntity>;
  topic?: Partial<TopicEntity>;
  parent?: PostWithRelations;
};

export class PostMapper {
  public static toResponseDtoList(
    posts: PostWithRelations[],
  ): PostResponseDto[] {
    if (!Array.isArray(posts) || posts.length === 0) return [];
    return posts.map((post) => this.toSingleResponseDto(post));
  }

  public static toSingleResponseDto(post: PostWithRelations): PostResponseDto {
    if (!post) return null as any;

    const author = post.user;
    const topic = post.topic;
    const parent = post.parent;

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      mainImage: post.mainImage ?? null,
      content: post.content,
      score: post.score ?? 0,
      readingTime: post.readingTime ?? 0,

      userId: author?.id ?? 0,
      author: this.formatAuthorName(author),
      authorUsername: author?.username ?? 'unknown',
      authorNickname: author?.nickname ?? '',
      authorBio: author?.bio ?? '',
      authorRole: author?.role ?? 'USER',
      authorAvatar: author?.avatar ?? null,

      topicId: topic?.id ?? 0,
      topicTitle: topic?.title ?? '',
      topicSlug: topic?.slug ?? '',
      topicTagId: topic?.tagId ?? 0,

      parentId: parent?.id ?? 0,
      parentTitle: parent?.title ?? '',
      parentSlug: parent?.slug ?? '',
      parentContent: parent?.content ?? '',

      parentUserId: parent?.user?.id ?? 0,
      parentAuthor: this.formatAuthorName(parent?.user),
      parentAuthorNickname: parent?.user?.nickname ?? '',
      parentAuthorBio: parent?.user?.bio ?? '',
      parentAuthorRole: parent?.user?.role ?? 'USER',
      parentAuthorUsername: parent?.user?.username ?? '',
      parentAuthorAvatar: parent?.user?.avatar ?? null,

      viewCount: post.viewCount ?? 0,
      postCount: post.postCount ?? 0,
      status: post.status,

      lastPostAt:
        post.lastPostAt instanceof Date ? post.lastPostAt : new Date(),
      createdAt: post.createdAt instanceof Date ? post.createdAt : new Date(),
      updatedAt: post.updatedAt instanceof Date ? post.updatedAt : new Date(),
    };
  }

  private static formatAuthorName(user?: Partial<UserEntity>): string {
    if (!user) return 'Anonymous';
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || user.nickname || user.username || 'Anonymous';
  }
}

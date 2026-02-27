import { TopicEntity } from '../entities/topic.entity';
import { TopicResponseDto } from '../dto/topic-response.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { TagEntity } from 'src/forum/tag/entities/tag.entity';

export type TopicWithRelations = TopicEntity & {
  user?: Partial<UserEntity>;
  tag?: Partial<TagEntity>;
};

export class TopicMapper {
  public static toResponseDtoList(
    topics: TopicWithRelations[],
  ): TopicResponseDto[] {
    if (!Array.isArray(topics) || topics.length === 0) return [];
    return topics.map((topic) => this.toSingleResponseDto(topic));
  }

  public static toSingleResponseDto(
    topic: TopicWithRelations,
  ): TopicResponseDto {
    if (!topic) return null as any;

    const author = topic.user;
    const tag = topic.tag;

    return {
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      content: topic.content,

      tagId: tag?.id ?? 0,
      tagTitle: tag?.title || '',
      tagSlug: tag?.slug || '',
      tagDescription: tag?.description || '',

      viewCount: topic.viewCount || 0,
      postCount: topic.postCount || 0,

      userId: author?.id ?? 0,
      authorUsername: author?.username || 'unknown',
      authorNickname: author?.nickname || '',
      authorBio: author?.bio || '',
      authorRole: author?.role || 'USER',
      author: this.formatAuthorName(author),
      authorAvatar: author?.avatar || '',

      lastPostAt: topic.lastPostAt,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,

      status: topic.status,
    };
  }

  private static formatAuthorName(author?: Partial<UserEntity>): string {
    if (!author) return 'Anonymous';
    if (author.firstName && author.lastName) {
      return `${author.firstName} ${author.lastName}`;
    }
    return author.nickname || author.username || 'Anonymous';
  }
}

import { TagEntity } from '../entities/tag.entity';
import { TagResponseDto } from '../dto/tag-response.dto';
import { UserEntity } from 'src/user/entities/user.entity';

export type TagWithRelations = TagEntity & {
  user?: Partial<UserEntity>;
};

export class TagMapper {
  public static toResponseDtoList(tags: TagWithRelations[]): TagResponseDto[] {
    if (!Array.isArray(tags) || tags.length === 0) return [];
    return tags.map((tag) => this.toSingleResponseDto(tag));
  }

  public static toSingleResponseDto(tag: TagWithRelations): TagResponseDto {
    if (!tag) return null as any;

    const user = tag.user;

    if (!user) {
      console.warn(
        `Tag ID ${tag.id} is missing relation: 'user'. Ensure include is present in Prisma query.`,
      );
    }

    return {
      id: tag.id,
      title: tag.title,
      description: tag.description,
      slug: tag.slug,

      userId: user?.id ?? 0,
      authorRole: user?.role ?? 'USER',
      authorNickname: user?.nickname ?? '',
      author: this.formatAuthorName(user),
      authorUsername: user?.username ?? '',
      authorAvatar: user?.avatar ?? '',
      email: user?.email ?? '',

      createdAt: tag.createdAt instanceof Date ? tag.createdAt : new Date(),
      updatedAt: tag.updatedAt instanceof Date ? tag.updatedAt : new Date(),

      status: tag.status,
    };
  }

  private static formatAuthorName(user?: Partial<UserEntity>): string {
    if (!user) return 'Anonymous';
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || user.nickname || user.username || 'Anonymous';
  }
}

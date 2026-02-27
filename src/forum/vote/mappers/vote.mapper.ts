import { Vote } from '@prisma/client';
import { VoteResponseDto } from '../dtos/vote-response.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { PostEntity } from 'src/forum/post/entities/post.entity';

export type PrismaVote = Vote & {
  user?: Partial<UserEntity>;
  post?: Partial<PostEntity>;
};

export class VoteMapper {
  public static toResponseDtoList(votes: PrismaVote[]): VoteResponseDto[] {
    if (!Array.isArray(votes) || votes.length === 0) return [];
    return votes.map((vote) => this.toResponseDto(vote));
  }

  public static toResponseDto(vote: PrismaVote): VoteResponseDto {
    if (!vote) return null as any;

    const user = vote.user;
    const post = vote.post;

    const response: VoteResponseDto = {
      id: vote.id,

      userId: user?.id ?? 0,
      username: user?.username || 'unknown',
      nickname: user?.nickname || '',
      postId: post?.id ?? 0,
      title: post?.title ?? '',
      content: post?.content ?? '',
      slug: post?.slug ?? '',

      type: vote.type ?? undefined,
      direction: vote.direction ?? undefined,

      createdAt: vote.createdAt instanceof Date ? vote.createdAt : new Date(),
      updatedAt: vote.updatedAt instanceof Date ? vote.updatedAt : new Date(),
    };

    return response;
  }
}

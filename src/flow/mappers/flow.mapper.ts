import { FlowEntity } from '../entities/flow.entity';
import { FlowResponseDto } from '../dto/flow-response.dto';
import { UserEntity } from 'src/user/entities/user.entity';

export type FlowWithRelations = FlowEntity & {
  author?: Partial<UserEntity> | null;
  parent?: Partial<FlowEntity> | null;
};

export class FlowMapper {
  public static toSingleResponseDto(flow: FlowWithRelations): FlowResponseDto {
    if (!flow) return null as any;

    const author = flow.author;
    const parent = flow.parent;

    return {
      id: flow.id,
      content: flow.content || '',
      slug: flow.slug || '',
      replyCount: flow.replyCount || 0,

      author: {
        id: author?.id ?? 0,
        username: author?.username || 'unknown',
        nickname: author?.nickname || '',
        role: author?.role || 'USER',
        avatar: author?.avatar || null,
      },

      parentId: flow.parentId ?? null,
      parentContent: parent?.content || null,
      parentSlug: parent?.slug || null,

      createdAt: flow.createdAt instanceof Date ? flow.createdAt : new Date(),
      updatedAt: flow.updatedAt instanceof Date ? flow.updatedAt : new Date(),
    };
  }

  public static toResponseDtoList(
    flows: FlowWithRelations[],
  ): FlowResponseDto[] {
    if (!Array.isArray(flows) || flows.length === 0) return [];
    return flows.map((flow) => this.toSingleResponseDto(flow));
  }
}

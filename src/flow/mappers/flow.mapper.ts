import { FlowDocument } from '../schemas/flow.schema';
import { FlowResponseDto } from '../dto/flow-response.dto';
import { UserDocument } from '../../user/schemas/user.schema';

export class FlowMapper {
  public static toResponseDto(document: FlowDocument): FlowResponseDto {
    const doc = document.toObject ? document.toObject() : document || {};
    const id = doc._id ? doc._id.toString() : doc.id;
    delete doc._id;
    delete doc.__v;

    const author = doc.author as unknown as UserDocument;
    const parentId = doc.parentId as unknown as FlowDocument;

    return {
      id,
      content: doc.content || '',
      author: {
        id: author?._id?.toString() || '',
        username: author?.username || '',
        nickname: author?.nickname || '',
        role: author?.role || 'user',
        avatar: author?.avatar || null || undefined,
      },
      parentId: parentId?._id?.toString() || parentId?.id || undefined,
      parentContent: parentId?.content || '',
      slug: doc.slug || '',
      parentSlug: parentId?.slug || '',
      replyCount: doc.replyCount || 0,
      createdAt:
        doc.createdAt instanceof Date
          ? doc.createdAt.toISOString()
          : doc.createdAt,
      updatedAt:
        doc.updatedAt instanceof Date
          ? doc.updatedAt.toISOString()
          : doc.updatedAt,
    };
  }

  public static toResponseDtoList(
    documents: FlowDocument[],
  ): FlowResponseDto[] {
    return documents.map((doc) => this.toResponseDto(doc));
  }
}

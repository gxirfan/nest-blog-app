import { ContactResponseDto } from '../dto/contact-response.dto';
import { ContactMessageEntity } from '../entities/contact-message.entity';

export class ContactMapper {
  public static toResponseDtoList(
    messages: ContactMessageEntity[],
  ): ContactResponseDto[] {
    if (!Array.isArray(messages) || messages.length === 0) return [];
    return messages.map((message) => this.toSingleResponseDto(message));
  }

  public static toSingleResponseDto(
    message: ContactMessageEntity,
  ): ContactResponseDto {
    if (!message) return null as any;

    return {
      id: message.id,
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
      slug: message.slug ?? null,
      isRead: message.isRead,

      createdAt:
        message.createdAt instanceof Date ? message.createdAt : new Date(),
      updatedAt:
        message.updatedAt instanceof Date ? message.updatedAt : new Date(),
    };
  }
}

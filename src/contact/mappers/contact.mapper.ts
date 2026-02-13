import { ContactResponseDto } from '../dto/contact-response.dto';
import { ContactMessageDocument } from '../schemas/contact-message.schema';

export class ContactMapper {
  public static toResponseDto(
    contactMessage: ContactMessageDocument[],
  ): ContactResponseDto[] {
    if (!contactMessage) return [];

    const contactObject = contactMessage.map((contact) =>
      contact.toObject({ virtuals: true }),
    );

    const response: ContactResponseDto[] = contactObject.map((contact) => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
      slug: contact.slug ?? '',
      isRead: contact.isRead,
      createdAt: contact.createdAt
        ? contact.createdAt instanceof Date
          ? contact.createdAt.toISOString()
          : new Date(contact.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: contact.updatedAt
        ? contact.updatedAt instanceof Date
          ? contact.updatedAt.toISOString()
          : new Date(contact.updatedAt).toISOString()
        : new Date().toISOString(),
    }));

    return response;
  }

  public static toSingleResponseDto(
    contactMessage: ContactMessageDocument,
  ): ContactResponseDto {
    return this.toResponseDto([contactMessage])[0];
  }
}

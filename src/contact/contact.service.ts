import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  ContactMessage,
  ContactMessageDocument,
} from './schemas/contact-message.schema';
import { Model } from 'mongoose';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import slugify from 'slugify';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(ContactMessage.name)
    private contactMessageModel: Model<ContactMessageDocument>,
  ) {}

  private async createUniqueSlug(title: string): Promise<string> {
    let baseSlug = slugify(title, { lower: true, strict: true });
    if (!baseSlug || baseSlug.trim() === '') baseSlug = 'censored-title';
    let slug = baseSlug;
    let existingPost = await this.contactMessageModel.exists({ slug }).exec();

    while (existingPost) {
      const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
      slug = `${baseSlug}-${randomSuffix}`;
      existingPost = await this.contactMessageModel.exists({ slug }).exec();
    }
    return slug;
  }

  async handleContactSubmission(
    data: CreateContactDto,
  ): Promise<ContactMessageDocument> {
    const slug = await this.createUniqueSlug(data.subject);
    const contactMessage = new this.contactMessageModel({
      ...data,
      slug,
    });
    return contactMessage.save();
  }

  async findAll(): Promise<ContactMessageDocument[]> {
    return this.contactMessageModel.find().exec();
  }

  async findAllPaginated(
    paginationQueryDto: PaginationQueryDto,
  ): Promise<IPaginationResponse<ContactMessageDocument>> {
    const { page, limit } = paginationQueryDto;
    const skip = (page - 1) * limit;

    // Execute count and data fetch in parallel for better performance
    const [data, total] = await Promise.all([
      this.contactMessageModel
        .find({ isRead: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.contactMessageModel.countDocuments().exec(),
    ]);

    // Calculate total pages for the metadata object
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOneById(id: string): Promise<ContactMessageDocument> {
    const contactMessage = await this.contactMessageModel.findById(id).exec();
    if (!contactMessage) {
      throw new NotFoundException('Contact message not found');
    }
    return contactMessage;
  }

  async findOneBySlug(slug: string): Promise<ContactMessageDocument> {
    const contactMessage = await this.contactMessageModel
      .findOne({ slug, isRead: false })
      .exec();
    if (!contactMessage) {
      throw new NotFoundException('Contact message not found');
    }
    // TODO: Mark as read if needed
    return contactMessage;
  }

  async update(
    id: string,
    contactMessage: CreateContactDto,
  ): Promise<ContactMessageDocument> {
    const updatedContactMessage = await this.contactMessageModel
      .findByIdAndUpdate(id, contactMessage, { new: true })
      .exec();
    if (!updatedContactMessage) {
      throw new NotFoundException('Contact message not found');
    }
    return updatedContactMessage;
  }

  async delete(id: string): Promise<ContactMessageDocument> {
    const deletedContactMessage = await this.contactMessageModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedContactMessage) {
      throw new NotFoundException('Contact message not found');
    }
    return deletedContactMessage;
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Flow, FlowDocument } from './schemas/flow.schema';
import { CreateFlowDto } from './dto/create-flow.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { IPaginationResponse } from '../common/interfaces/pagination-response.interface';
import slugify from 'slugify';
import { FlowRepliedEvent } from 'src/notification/events/notification.events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class FlowService {
  constructor(
    @InjectModel(Flow.name) private flowModel: Model<FlowDocument>,
    private userService: UserService,
    private eventEmitter: EventEmitter2,
  ) {}

  private async createUniqueSlug(title: string): Promise<string> {
    let baseSlug = slugify(title, { lower: true, strict: true });

    if (!baseSlug || baseSlug.trim() === '') baseSlug = 'censored-title';

    let slug = baseSlug;

    let existingPost = await this.flowModel.exists({ slug }).exec();

    while (existingPost) {
      const randomSuffix = Math.floor(Math.random() * 9000) + 1000;

      slug = `${baseSlug}-${randomSuffix}`;

      existingPost = await this.flowModel.exists({ slug }).exec();
    }

    return slug;
  }

  private async updateReplyCount(
    flowId: Types.ObjectId | string,
    increment: 1 | -1,
  ): Promise<void> {
    await this.flowModel
      .findByIdAndUpdate(flowId, { $inc: { replyCount: increment } })
      .exec();
  }

  async create(
    userId: string,
    createFlowDto: CreateFlowDto,
  ): Promise<FlowDocument> {
    const slug = await this.createUniqueSlug(createFlowDto.content);

    if (!createFlowDto.content || createFlowDto.content.trim() === '') {
      throw new BadRequestException('Flow content cannot be empty.');
    }

    const newFlow = await this.flowModel.create({
      ...createFlowDto,
      content: createFlowDto.content.trim(),
      slug,
      author: new Types.ObjectId(userId),
    });

    const createdFlow = await newFlow.populate({
      path: 'author',
      select: 'username nickname avatar role',
    });

    if (createdFlow.parentId) {
      await this.updateReplyCount(createdFlow.parentId, 1);

      const parentFlow = await this.flowModel
        .findById(createdFlow.parentId)
        .lean()
        .exec();

      if (parentFlow && parentFlow.author.toString() !== userId) {
        this.eventEmitter.emit(
          'flow.replied',
          new FlowRepliedEvent(
            userId,
            (createdFlow.author as any).nickname,
            parentFlow.author.toString(),
            parentFlow.content.substring(0, 30),
            createdFlow.slug,
            createdFlow.id,
          ),
        );
      }
    }

    return createdFlow;
  }

  async findAll(
    paginationQueryDto: PaginationQueryDto,
  ): Promise<IPaginationResponse<FlowDocument>> {
    const limit = paginationQueryDto.limit || 20;
    const page = paginationQueryDto.page || 1;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.flowModel
        .find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'author', select: 'username nickname avatar role' })
        .populate({ path: 'parentId', select: 'content slug' })
        .lean()
        .exec(),
      this.flowModel.countDocuments({ isDeleted: false }),
    ]);

    // const safeData = data || [];
    const safeData = (data || []).map((item: any) => {
      return {
        ...item,
        id: item._id?.toString(),
        _id: undefined,
        __v: undefined,
      };
    });

    // return {
    //   data: safeData,
    //   meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    // };

    return {
      data: safeData as unknown as FlowDocument[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string): Promise<FlowDocument> {
    const flow = await this.flowModel
      .findOne({ slug, isDeleted: false })
      .populate({ path: 'author', select: 'username nickname avatar role' })
      .populate({
        path: 'parentId',
        select: 'content slug',
      })
      .lean()
      .exec();

    if (!flow) throw new NotFoundException('Flow not found');
    return flow as unknown as FlowDocument;
  }

  async findReplies(
    parentId: string,
    queryDto: PaginationQueryDto,
  ): Promise<IPaginationResponse<FlowDocument>> {
    const { page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.flowModel
        .find({ parentId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'author', select: 'username nickname avatar role' })
        .lean()
        .exec(),
      this.flowModel.countDocuments({ parentId, isDeleted: false }),
    ]);

    return {
      data: data as unknown as FlowDocument[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateBySlug(
    slug: string,
    updateFlowDto: UpdateFlowDto,
  ): Promise<FlowDocument> {
    const existingFlow = await this.flowModel.findOne({
      slug,
      isDeleted: false,
    });
    if (!existingFlow) throw new NotFoundException('Flow not found');

    const updateData: any = { ...updateFlowDto };

    if (updateFlowDto.isDeleted === true && existingFlow.isDeleted === false) {
      if (existingFlow.parentId) {
        await this.flowModel.findByIdAndUpdate(existingFlow.parentId, {
          $inc: { replyCount: -1 },
        });
        // TODO: Update Reply Count for totalReplyCount
      }
    }

    if (
      updateFlowDto.content &&
      updateFlowDto.content !== existingFlow.content
    ) {
      updateData.slug = await this.createUniqueSlug(updateFlowDto.content);
    }

    const updatedFlow = await this.flowModel
      .findOneAndUpdate(
        { slug, isDeleted: false },
        { $set: updateData },
        { new: true },
      )
      .populate({ path: 'author', select: 'username nickname avatar role' })
      .populate({ path: 'parentId', select: 'content slug' })
      .lean()
      .exec();

    if (!updatedFlow)
      throw new NotFoundException('Flow not found or already deleted');

    return updatedFlow as unknown as FlowDocument;
  }

  async findByUsername(username: string, queryDto: PaginationQueryDto) {
    const { page, limit } = queryDto;
    const skip = (page - 1) * limit;

    const user = await this.userService.findOneByUsername(username);

    const [data, total] = await Promise.all([
      this.flowModel
        .find({ author: user._id, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'author', select: 'username nickname avatar role' })
        .lean()
        .exec(),
      this.flowModel.countDocuments({ author: user._id, isDeleted: false }),
    ]);
    return {
      data: data as unknown as FlowDocument[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}

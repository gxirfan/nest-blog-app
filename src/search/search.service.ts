import { Injectable } from '@nestjs/common';
import { CreateSearchDto } from './dto/create-search.dto';
import { ISearchService } from './interfaces/search-service.interface';
import { SearchResultDto } from './dto/search-result.dto';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { Types, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { Post, PostDocument } from 'src/forum/posts/schemas/post.schema';
import { Flow, FlowDocument } from 'src/flow/schemas/flow.schema';
import { Tag, TagDocument } from 'src/forum/tags/schemas/tag.schema';
import { Topic, TopicDocument } from 'src/forum/topics/schemas/topic.schema';
import { SearchLog, SearchLogDocument } from './entities/search.schema';

@Injectable()
export class SearchService implements ISearchService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Flow.name) private flowModel: Model<FlowDocument>,
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
    @InjectModel(SearchLog.name)
    private searchLogModel: Model<SearchLogDocument>,
  ) {}
  private async logSearch(query: string, userId?: string) {
    await this.searchLogModel.findOneAndUpdate(
      { query: query.toLowerCase() },
      {
        $inc: { count: 1 },
        $set: { userId: userId ? new Types.ObjectId(userId) : null },
      },
      { upsert: true },
    );
  }

  async search(
    createSearchDto: CreateSearchDto,
  ): Promise<IPaginationResponse<SearchResultDto>> {
    const { paginationQueryDto, userId } = createSearchDto;
    const query = paginationQueryDto.q;
    const { page = 1, limit = 10 } = paginationQueryDto;
    if (!query)
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };

    const searchRegex = new RegExp(query, 'i');

    void this.logSearch(query, userId);

    const [users, posts, flows, tags, topics] = await Promise.all([
      this.userModel
        .find({ $or: [{ username: searchRegex }, { nickname: searchRegex }] })
        .limit(limit)
        .lean(),
      this.postModel.find({ title: searchRegex }).limit(limit).lean(),
      this.flowModel.find({ content: searchRegex }).limit(limit).lean(),
      this.tagModel.find({ name: searchRegex }).limit(limit).lean(),
      this.topicModel.find({ name: searchRegex }).limit(limit).lean(),
    ]);

    const combinedResults: SearchResultDto[] = [
      ...users.map((u) => ({
        type: 'user' as const,
        id: u._id.toString(),
        title: u.username,
        subTitle: u.nickname,
        url: u.username,
        avatar: u.avatar,
      })),
      ...posts.map((p) => ({
        type: 'post' as const,
        id: p._id.toString(),
        title: p.title,
        url: p.slug,
      })),
      ...flows.map((f) => ({
        type: 'flow' as const,
        id: f._id.toString(),
        title: f.content.substring(0, 60),
        url: f.slug,
      })),
      ...tags.map((t) => ({
        type: 'tag' as const,
        id: t._id.toString(),
        title: `#${t.title}`,
        url: t.slug,
      })),
      ...topics.map((tp) => ({
        type: 'topic' as const,
        id: tp._id.toString(),
        title: tp.title,
        url: tp.slug,
      })),
    ];

    const total = combinedResults.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = combinedResults.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // findAll() {
  //   return `This action returns all search`;
  // }

  // findOne(id: string) {
  //   return `This action returns a #${id} search`;
  // }

  // update(id: string, updateSearchDto: CreateSearchDto) {
  //   return `This action updates a #${id} search`;
  // }

  // remove(id: string) {
  //   return `This action removes a #${id} search`;
  // }
}

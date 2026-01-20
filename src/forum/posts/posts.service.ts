import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { InjectModel } from '@nestjs/mongoose';
import slugify from 'slugify';
import { UserService } from 'src/user/user.service';
import { TopicsService } from 'src/forum/topics/topics.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ReplyCreatedEvent } from 'src/notification/events/notification.events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import * as cheerio from 'cheerio';
import { join } from 'path';
import * as fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly userService: UserService,
    private readonly topicService: TopicsService,
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache,
    private eventEmitter: EventEmitter2,
  ) {}

  private async createUniqueSlug(title: string): Promise<string> {
    let baseSlug = slugify(title, { lower: true, strict: true });

    if (!baseSlug || baseSlug.trim() === '') baseSlug = 'censored-title';

    let slug = baseSlug;

    let existingPost = await this.postModel.exists({ slug }).exec();

    while (existingPost) {
      const randomSuffix = Math.floor(Math.random() * 9000) + 1000;

      slug = `${baseSlug}-${randomSuffix}`;

      existingPost = await this.postModel.exists({ slug }).exec();
    }

    return slug;
  }

  private async updateLastPostAt(postId: string) {
    await this.postModel
      .updateOne({ _id: postId }, { lastPostAt: new Date() })
      .exec();
  }

  private async updatePostCount(postId: string) {
    await this.postModel
      .updateOne(
        { _id: postId },
        {
          postCount: await this.postModel
            .countDocuments({ parentId: postId, status: true })
            .exec(),
        },
      )
      .exec();
  }

  private async processImagesInContent(content: string): Promise<string> {
    const $ = cheerio.load(content);
    const images = $('img');

    if (images.length === 0) return content;

    const uploadPath = join(process.cwd(), 'public', 'uploads', 'posts');
    await fs.ensureDir(uploadPath);

    for (let i = 0; i < images.length; i++) {
      const src = $(images[i]).attr('src');

      if (src && src.startsWith('data:image')) {
        const fileName = `${uuidv4()}.webp`;
        const filePath = join(uploadPath, fileName);

        const base64Data = src.replace(/^data:image\/\w+;base64,/, '');
        await fs.writeFile(filePath, base64Data, 'base64');

        const publicUrl = `/public/uploads/posts/${fileName}`;
        $(images[i]).attr('src', publicUrl);
      }
    }
    return $.html();
  }

  private saveBase64Image(
    base64Data: string,
    subFolder: string,
  ): string | null {
    if (!base64Data) return null;

    const urlRegex = /^(https?:\/\/[^\s]+)\//;
    const match = base64Data.match(urlRegex);
    const apiUrl = match ? match[1] : 'http://localhost:3000/';

    if (!base64Data.startsWith('data:image')) {
      return base64Data.includes(apiUrl)
        ? base64Data.replace(apiUrl, '')
        : base64Data;
    }

    const mimeType = base64Data.match(
      /data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/,
    )?.[1];
    const extension = mimeType?.split('/')[1] || 'jpg';

    const base64Image = base64Data.split(';base64,').pop();
    if (!base64Image) return null;

    const uploadDir = join(process.cwd(), 'public', 'uploads', subFolder);
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${uuidv4()}.${extension}`;
    const filePath = join(uploadDir, fileName);

    writeFileSync(filePath, Buffer.from(base64Image, 'base64'));

    return `/public/uploads/${subFolder}/${fileName}`;
  }

  private calculateReadingTime(content: string): number {
    if (!content) return 0;
    const plainText = content.replace(/<[^>]*>/g, '');
    const words = plainText.trim().split(/\s+/).length;
    const wpm = 200;

    return Math.ceil(words / wpm);
  }

  async createPost(userId: string, createPostDto: CreatePostDto) {
    const { mainImage, ...otherFields } = createPostDto;
    const content = await this.processImagesInContent(createPostDto.content);
    const post = new this.postModel({
      ...otherFields,
      userId,
      slug: await this.createUniqueSlug(createPostDto.title),
      content,
      readingTime: this.calculateReadingTime(content),
    });

    if (mainImage) {
      post.mainImage =
        this.saveBase64Image(mainImage, 'postCovers') ?? undefined;
    }

    await this.topicService.updateLastPostAt(createPostDto.topicId);

    const savedPost = await post.save();

    if (savedPost && savedPost.topicId) {
      await this.updateLastPostAt(savedPost.topicId);
      await this.updatePostCount(savedPost.topicId);

      const count = await this.countDocumentsByTopicId(savedPost.topicId);
      await this.topicService.updateLastPostAt(savedPost.topicId);
      await this.topicService.updatePostCount(savedPost.topicId, count);
    }

    if (savedPost && savedPost.parentId) {
      await this.updateLastPostAt(savedPost.parentId);
      await this.updatePostCount(savedPost.parentId);
    }

    if (createPostDto.parentId) {
      const parentPost = await this.postModel.findById(createPostDto.parentId);
      const replier = await this.userService.findOneById(userId);

      if (parentPost) {
        this.eventEmitter.emit(
          'post.reply',
          new ReplyCreatedEvent(
            parentPost.id,
            parentPost.title,
            parentPost.slug,
            savedPost.id,
            savedPost.slug,
            userId,
            replier.username,
            replier.nickname,
            parentPost.userId,
          ),
        );
      }
    }

    return savedPost;
  }

  public async incrementViewCount(
    postId: string,
    clientIdentifier: string,
  ): Promise<void> {
    const cacheKey = `VIEWED_POST_${postId}_${clientIdentifier}`;

    const viewed = await this.cacheManager.get(cacheKey);

    if (viewed) return;

    this.postModel.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } }).exec();

    this.cacheManager.set(cacheKey, '1', 86400);
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostDocument>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const activeTopics = await this.topicService.findStatusTrue();
    const activeTopicIds = activeTopics.map((topic) => topic.id);

    const [posts, total] = await Promise.all([
      this.postModel
        .find({ topicId: { $in: activeTopicIds }, status: true })
        .populate({
          path: 'userId',
          select: 'username role nickname firstName lastName email avatar',
        })
        .populate({ path: 'topicId', select: 'title slug tagId' })
        .populate({ path: 'parentId', select: 'title slug' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel
        .countDocuments({ topicId: { $in: activeTopicIds }, status: true })
        .exec(),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByViewCountPaginated(
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostDocument>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const activeTopics = await this.topicService.findStatusTrue();
    const activeTopicIds = activeTopics.map((topic) => topic.id);

    const [posts, total] = await Promise.all([
      this.postModel
        .find({ topicId: { $in: activeTopicIds }, status: true })
        .populate({
          path: 'userId',
          select: 'username role nickname firstName lastName email avatar',
        })
        .populate({ path: 'topicId', select: 'title slug tagId' })
        .populate({ path: 'parentId', select: 'title slug' })
        .sort({ viewCount: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel
        .countDocuments({ topicId: { $in: activeTopicIds }, status: true })
        .exec(),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAll(): Promise<PostDocument[]> {
    const posts = await this.postModel
      .find()
      .populate({
        path: 'userId',
        select: 'username role nickname firstName lastName email avatar',
      })
      .populate({ path: 'topicId', select: 'title slug tagId' })
      .populate({ path: 'parentId', select: 'title slug' })
      .sort({ createdAt: -1 })
      .exec();

    if (!posts) throw new NotFoundException('Posts not found');

    return posts;
  }

  async countDocumentsByTopicId(topicId: string): Promise<number> {
    return this.postModel.countDocuments({ topicId, status: true }).exec();
  }

  async findAllByUserId(userId: string): Promise<PostDocument[]> {
    const posts = await this.postModel
      .find({ userId })
      .populate({
        path: 'userId',
        select: 'username role nickname firstName lastName email avatar',
      })
      .populate({ path: 'topicId', select: 'title slug tagId' })
      .populate({ path: 'parentId', select: 'title slug' })
      .sort({ createdAt: -1 })
      .exec();

    if (!posts) throw new NotFoundException('Posts not found');

    return posts;
  }

  async findAllByUserIdPaginated(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostDocument>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const activeTopics = await this.topicService.findStatusTrue();
    const activeTopicIds = activeTopics.map((topic) => topic.id);

    const [posts, total] = await Promise.all([
      this.postModel
        .find({ userId, topicId: { $in: activeTopicIds }, status: true })
        .populate({
          path: 'userId',
          select: 'username role nickname firstName lastName email avatar',
        })
        .populate({ path: 'topicId', select: 'title slug tagId' })
        .populate({ path: 'parentId', select: 'title slug' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel
        .countDocuments({
          userId,
          topicId: { $in: activeTopicIds },
          status: true,
        })
        .exec(),
    ]);
    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByUsernamePaginated(
    username: string,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostDocument>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const activeTopics = await this.topicService.findStatusTrue();
    const activeTopicIds = activeTopics.map((topic) => topic.id);

    const user = await this.userService.findOneByUsername(username);
    if (!user) throw new NotFoundException('User not found');

    const [posts, total] = await Promise.all([
      this.postModel
        .find({
          userId: user.id,
          topicId: { $in: activeTopicIds },
          status: true,
        })
        .populate({
          path: 'userId',
          select: 'username role nickname firstName lastName email avatar',
        })
        .populate({ path: 'topicId', select: 'title slug tagId' })
        .populate({ path: 'parentId', select: 'title slug' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel
        .countDocuments({
          userId: user.id,
          topicId: { $in: activeTopicIds },
          status: true,
        })
        .exec(),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByTopicIdPaginated(
    topicId: string,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostDocument>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const activeTopics = await this.topicService.findStatusTrue();
    const activeTopicIds = activeTopics
      .map((topic) => topic.id.toString())
      .filter((id) => id === topicId);

    const findFilter = {
      topicId: { $in: activeTopicIds },
      status: true,
      parentId: null,
    };

    const [posts, total] = await Promise.all([
      this.postModel
        .find(findFilter)
        .populate({
          path: 'userId',
          select: 'username role nickname firstName lastName email avatar',
        })
        .populate({ path: 'topicId', select: 'title slug tagId' })
        .populate({ path: 'parentId', select: 'title slug' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments(findFilter).exec(),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllByParentIdPaginated(
    parentId: string,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostDocument>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const activeTopics = await this.topicService.findStatusTrue();
    const activeTopicIds = activeTopics.map((topic) => topic.id);

    const [posts, total] = await Promise.all([
      this.postModel
        .find({ topicId: { $in: activeTopicIds }, parentId, status: true })
        .populate({
          path: 'userId',
          select: 'username role nickname firstName lastName email avatar',
        })
        .populate({ path: 'topicId', select: 'title slug tagId' })
        .populate({ path: 'parentId', select: 'title slug' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel
        .countDocuments({
          topicId: { $in: activeTopicIds },
          parentId,
          status: true,
        })
        .exec(),
    ]);
    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByUserIdForLibraryMyPostsPaginated(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<IPaginationResponse<PostDocument>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.postModel
        .find({ userId })
        .populate({
          path: 'userId',
          select: 'username role nickname firstName lastName email avatar',
        })
        .populate({ path: 'topicId', select: 'title slug tagId' })
        .populate({ path: 'parentId', select: 'title slug' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments({ userId }).exec(),
    ]);
    return {
      data: posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<PostDocument> {
    const post = await this.postModel
      .findById(id)
      .populate({
        path: 'userId',
        select: 'username role nickname firstName lastName email avatar',
      })
      .populate({ path: 'topicId', select: 'title slug tagId' })
      .populate({ path: 'parentId', select: 'title slug' })
      .sort({ createdAt: -1 })
      .exec();

    if (!post) throw new NotFoundException('Post not found');

    return post;
  }

  async findOneBySlug(userId: string, slug: string): Promise<PostDocument> {
    const post = await this.postModel
      .findOne({ slug })
      .populate({
        path: 'userId',
        select: 'username role nickname firstName lastName email avatar',
      })
      .populate({ path: 'topicId', select: 'title slug tagId' })
      .populate({ path: 'parentId', select: 'title slug' })
      .sort({ createdAt: -1 })
      .exec();

    if (!post) throw new NotFoundException('Post not found');

    const topic = await this.topicService.findOneById(post.topicId);

    if (!topic) throw new NotFoundException('Topic not found');

    const user = userId ? await this.userService.findOneById(userId) : null;

    if (user !== null && (user.role === 'admin' || user.role === 'moderator'))
      return post;

    if (
      topic.status === false &&
      Object(topic.userId).id !== userId &&
      post.status === false &&
      Object(post.userId).id !== userId
    )
      throw new UnauthorizedException(
        'You are not authorized to view this post',
      );

    return post;
  }

  async update(
    id: string,
    userId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDocument> {
    const [post, user] = await Promise.all([
      this.postModel.findById(id).exec(),
      this.userService.findOneById(userId),
    ]);

    if (!post) throw new NotFoundException('Post not found');
    if (!user) throw new NotFoundException('User not found');

    const canUpdate =
      user.role === 'admin' ||
      user.role === 'moderator' ||
      post.userId.toString() === userId;
    if (!canUpdate) throw new UnauthorizedException('You are not authorized');

    if (updatePostDto.title && updatePostDto.title !== post.title) {
      post.title = updatePostDto.title;
      post.slug = await this.createUniqueSlug(updatePostDto.title);
    }

    if (updatePostDto.content) {
      post.content = await this.processImagesInContent(updatePostDto.content);
      post.readingTime = this.calculateReadingTime(post.content);
    }

    if (updatePostDto.mainImage) {
      post.mainImage =
        this.saveBase64Image(updatePostDto.mainImage, 'postCovers') ??
        undefined;
    }

    const { title, content, slug, mainImage, ...rest } = updatePostDto;
    Object.assign(post, rest);

    const updatedPost = await post.save();

    this.updatePostCount(post.id).catch((err) =>
      console.error('Post count update failed:', err),
    );

    return updatedPost;
  }

  async updateTotalScores(
    postId: string,
    score: number,
    upvotes: number,
    downvotes: number,
  ): Promise<PostDocument> {
    const post = await this.postModel.findById(postId).exec();

    if (!post) throw new NotFoundException('Post not found');

    post.score = score ? score : undefined;
    post.upvotes = upvotes ? upvotes : undefined;
    post.downvotes = downvotes ? downvotes : undefined;

    return post.save();
  }

  async updateOneByIdAsAdmin(
    id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDocument> {
    const updatedPost = await this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true })
      .exec();

    if (!updatedPost) throw new NotFoundException('Post not found');

    return updatedPost;
  }

  async delete(id: string): Promise<PostDocument> {
    const deletedPost = await this.postModel.findByIdAndDelete(id).exec();

    if (!deletedPost) throw new NotFoundException('Post not found');

    return deletedPost;
  }
}

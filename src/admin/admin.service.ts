import { Injectable } from '@nestjs/common';
import { TagsService } from 'src/forum/tag/tags.service';
import { TopicsService } from 'src/forum/topic/topics.service';
import { PostsService } from 'src/forum/post/posts.service';
import { UserService } from 'src/user/user.service';
import { UpdateUserByAdminDto } from 'src/user/dto/update-user.dto';
import { UpdateTagDto } from 'src/forum/tag/dto/update-tag.dto';
import { UpdateTopicDto } from 'src/forum/topic/dto/update-topic.dto';
import { UpdatePostDto } from 'src/forum/post/dto/update-post.dto';
import { FlowService } from 'src/flow/flow.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ContactService } from 'src/contact/contact.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly tagService: TagsService,
    private readonly topicService: TopicsService,
    private readonly postsService: PostsService,
    private readonly flowService: FlowService,
    private readonly contactService: ContactService,
  ) {}

  // --- USER OPERATIONS ---
  async findAllUsers() {
    return await this.userService.findAll();
  }

  async findOneUserById(id: string) {
    return await this.userService.findOneById(Number(id));
  }

  async updateUserByAdmin(
    id: string,
    user: UpdateUserByAdminDto,
    adminId: string,
  ) {
    return await this.userService.updateUserById(
      Number(id),
      user,
      Number(adminId),
    );
  }

  async updatePasswordByAdmin(
    id: string,
    newPassword: string,
    adminId: string,
  ) {
    return await this.userService.updatePasswordById(
      Number(id),
      newPassword,
      Number(adminId),
    );
  }

  async deleteUser(id: string, adminId: string) {
    return await this.userService.deleteUserById(Number(id), Number(adminId));
  }

  // --- TAG OPERATIONS ---
  async findAllTags() {
    return await this.tagService.findAll();
  }

  async findOneTagById(id: string) {
    return await this.tagService.findOneByIdAsDocument(Number(id));
  }

  async updateTagById(id: string, tag: UpdateTagDto) {
    return await this.tagService.updateOneByIdAsAdmin(Number(id), tag);
  }

  async deleteTagById(id: string) {
    return await this.tagService.deleteOneById(Number(id));
  }

  // --- TOPIC OPERATIONS ---
  async findAllTopics() {
    return await this.topicService.findAll();
  }

  async findOneTopicById(id: string) {
    return await this.topicService.findOneById(Number(id));
  }

  async updateTopicById(id: string, topic: UpdateTopicDto) {
    return await this.topicService.updateOneByIdAsAdmin(Number(id), topic);
  }

  async deleteTopicById(id: string) {
    return await this.topicService.deleteOneById(Number(id));
  }

  // --- POST OPERATIONS ---
  async findAllPosts() {
    return await this.postsService.findAll();
  }

  async findOnePostById(id: string) {
    return await this.postsService.findOne(Number(id));
  }

  async findOnePostBySlug(userId: number | null, slug: string) {
    return await this.postsService.findOneBySlug(userId, slug);
  }

  async updatePostById(id: string, post: UpdatePostDto) {
    return await this.postsService.updateOneByIdAsAdmin(Number(id), post);
  }

  async deletePostById(id: string) {
    return await this.postsService.delete(Number(id));
  }

  // --- FLOW OPERATIONS ---
  async findAllFlowPosts(paginationQueryDto: PaginationQueryDto) {
    return await this.flowService.findAll(paginationQueryDto);
  }

  // --- CONTACTS OPERATIONS ---
  async findAllContacts(paginationQueryDto: PaginationQueryDto) {
    return await this.contactService.findAllPaginated(paginationQueryDto);
  }

  async findOneContactBySlug(slug: string) {
    return await this.contactService.findOneBySlug(slug);
  }
}

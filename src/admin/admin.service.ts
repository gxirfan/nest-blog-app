import { Injectable } from '@nestjs/common';
import { TagsService } from 'src/forum/tags/tags.service';
import { TopicsService } from 'src/forum/topics/topics.service';
import { PostsService } from 'src/forum/posts/posts.service';
import { UserService } from 'src/user/user.service';
import { UpdateUserByAdminDto } from 'src/user/dto/update-user.dto';
import { UpdateTagDto } from 'src/forum/tags/dto/update-tag.dto';
import { UpdateTopicDto } from 'src/forum/topics/dto/update-topic.dto';
import { UpdatePostDto } from 'src/forum/posts/dto/update-post.dto';
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

  async findAllUsers() {
    return await this.userService.findAll();
  }

  async findOneUserById(id: string) {
    return await this.userService.findOneById(id);
  }

  async updateUserByAdmin(
    id: string,
    user: UpdateUserByAdminDto,
    adminId: string,
  ) {
    return await this.userService.updateUserById(id, user, adminId);
  }

  async updatePasswordByAdmin(
    id: string,
    newPassword: string,
    adminId: string,
  ) {
    return await this.userService.updatePasswordById(id, newPassword, adminId);
  }

  async deleteUser(id: string, adminId: string) {
    return await this.userService.deleteUserById(id, adminId);
  }

  //tag
  async findAllTags() {
    return await this.tagService.findAll();
  }

  async findOneTagById(id: string) {
    return await this.tagService.findOneByIdAsDocument(id);
  }

  async updateTagById(id: string, tag: UpdateTagDto) {
    return await this.tagService.updateOneByIdAsAdmin(id, tag);
  }

  async deleteTagById(id: string) {
    return await this.tagService.deleteOneById(id);
  }

  //topic
  async findAllTopics() {
    return await this.topicService.findAll();
  }

  async findOneTopicById(id: string) {
    return await this.topicService.findOneById(id);
  }

  async updateTopicById(id: string, topic: UpdateTopicDto) {
    return await this.topicService.updateOneByIdAsAdmin(id, topic);
  }

  async deleteTopicById(id: string) {
    return await this.topicService.deleteOneById(id);
  }

  //post
  async findAllPosts() {
    return await this.postsService.findAll();
  }

  async findOnePostById(id: string) {
    return await this.postsService.findOne(id);
  }

  async updatePostById(id: string, post: UpdatePostDto) {
    return await this.postsService.updateOneByIdAsAdmin(id, post);
  }

  async deletePostById(id: string) {
    return await this.postsService.delete(id);
  }

  //flow
  async findAllFlowPosts(paginationQueryDto: PaginationQueryDto) {
    return await this.flowService.findAll(paginationQueryDto);
  }

  //contacts
  async findAllContacts(paginationQueryDto: PaginationQueryDto) {
    return await this.contactService.findAllPaginated(paginationQueryDto);
  }

  async findOneContactBySlug(slug: string) {
    return await this.contactService.findOneBySlug(slug);
  }
}

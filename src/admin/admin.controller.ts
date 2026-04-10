import {
  Controller,
  Delete,
  Get,
  Param,
  Body,
  Patch,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  HttpCode,
} from '@nestjs/common';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { UpdateUserByAdminDto } from 'src/user/dto/update-user.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { TagResponseDto } from 'src/forum/tag/dto/tag-response.dto';
import { TagMapper } from 'src/forum/tag/mappers/tag.mapper';
import { UpdateTagDto } from 'src/forum/tag/dto/update-tag.dto';
import { TopicResponseDto } from 'src/forum/topic/dto/topic-response.dto';
import { TopicMapper } from 'src/forum/topic/mappers/topic.mapper';
import { UpdateTopicDto } from 'src/forum/topic/dto/update-topic.dto';
import { AdminService } from './admin.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';
import { FlowMapper } from 'src/flow/mappers/flow.mapper';
import { ContactMapper } from 'src/contact/mappers/contact.mapper';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { ContactResponseDto } from 'src/contact/dto/contact-response.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { FlowResponseDto } from 'src/flow/dto/flow-response.dto';
import { PostMapper } from 'src/forum/post/mappers/post.mapper';
import { PostResponseDto } from 'src/forum/post/dto/post-response.dto';

@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@UseInterceptors(TransformInterceptor)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  //user
  @Get('get-users')
  @ResponseMessage('Users fetched successfully.')
  async findAll(): Promise<UserResponseDto[]> {
    return await this.adminService.findAllUsers();
  }

  @Get('get-user/:id')
  @ResponseMessage('User fetched successfully.')
  async findOneById(@Param('id') id: string): Promise<UserResponseDto> {
    return await this.adminService.findOneUserById(id);
  }

  @Patch('update-user/:id')
  @ResponseMessage('User updated successfully.')
  async updateUser(
    @Param('id') id: string,
    @Body() user: UpdateUserByAdminDto,
    @Req() req,
  ): Promise<UserResponseDto> {
    return await this.adminService.updateUserByAdmin(id, user, req.user.id);
  }

  @Patch('update-password/:id')
  @ResponseMessage('User password updated successfully.')
  async updatePassword(
    @Param('id') id: string,
    @Body() newPassword: string,
    @Req() req,
  ): Promise<UserResponseDto> {
    return await this.adminService.updatePasswordByAdmin(
      id,
      newPassword,
      req.user.id,
    );
  }

  @Delete('delete-user/:id')
  @ResponseMessage('User deleted successfully.')
  async deleteUser(
    @Param('id') id: string,
    @Req() req,
  ): Promise<UserResponseDto> {
    return await this.adminService.deleteUser(id, req.user.id);
  }

  //tag
  @Get('get-tags')
  @ResponseMessage('Tags fetched successfully.')
  async findAllTags(): Promise<TagResponseDto[]> {
    return TagMapper.toResponseDtoList(await this.adminService.findAllTags());
  }

  @Get('get-tag/:id')
  @ResponseMessage('Tag fetched successfully.')
  async tagFindOneById(@Param('id') id: string): Promise<TagResponseDto> {
    return TagMapper.toSingleResponseDto(
      await this.adminService.findOneTagById(id),
    );
  }

  @Patch('update-tag/:id')
  @ResponseMessage('Tag updated successfully.')
  async tagUpdateOneById(
    @Param('id') id: string,
    @Body() tag: UpdateTagDto,
  ): Promise<TagResponseDto> {
    return TagMapper.toSingleResponseDto(
      await this.adminService.updateTagById(id, tag),
    );
  }

  @Delete('delete-tag/:id')
  @ResponseMessage('Tag deleted successfully.')
  async tagDeleteOneById(@Param('id') id: string): Promise<void> {
    await this.adminService.deleteTagById(id);
  }

  //topic
  @Get('get-topics')
  @ResponseMessage('Topics fetched successfully.')
  async findAllTopics(): Promise<TopicResponseDto[]> {
    return TopicMapper.toResponseDtoList(
      await this.adminService.findAllTopics(),
    );
  }

  @Get('get-topic/:id')
  @ResponseMessage('Topic fetched successfully.')
  async topicFindOneById(@Param('id') id: string): Promise<TopicResponseDto> {
    return TopicMapper.toSingleResponseDto(
      await this.adminService.findOneTopicById(id),
    );
  }

  @Patch('update-topic/:id')
  @ResponseMessage('Topic updated successfully.')
  async topicUpdateOneById(
    @Param('id') id: string,
    @Body() topic: UpdateTopicDto,
  ): Promise<TopicResponseDto> {
    return TopicMapper.toSingleResponseDto(
      await this.adminService.updateTopicById(id, topic),
    );
  }

  @Delete('delete-topic/:id')
  @ResponseMessage('Topic deleted successfully.')
  async topicDeleteOneById(@Param('id') id: string): Promise<void> {
    await this.adminService.deleteTopicById(id);
  }

  //post
  @Delete('delete-post/:id')
  @ResponseMessage('Post deleted successfully.')
  async deletePost(@Param('id') id: string): Promise<void> {
    await this.adminService.deletePostById(id);
  }

  @Get('get-flow-posts')
  @ResponseMessage('Flow posts fetched successfully.')
  async findAllFlowPosts(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<IPaginationResponse<FlowResponseDto>> {
    const result = await this.adminService.findAllFlowPosts(paginationQueryDto);
    return {
      data: FlowMapper.toResponseDtoList(result.data),
      meta: result.meta,
    };
  }

  //contacts
  @Get('get-contacts')
  @HttpCode(200)
  @ResponseMessage('Contacts fetched successfully.')
  async findAllContacts(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<IPaginationResponse<ContactResponseDto>> {
    const result = await this.adminService.findAllContacts(paginationQueryDto);
    return {
      data: ContactMapper.toResponseDtoList(result.data),
      meta: result.meta,
    };
  }

  @Get('get-contact/:slug')
  @ResponseMessage('Contact fetched successfully.')
  async findOneContactBySlug(@Param('slug') slug: string) {
    return ContactMapper.toSingleResponseDto(
      await this.adminService.findOneContactBySlug(slug),
    );
  }

  //posts
  @Get('get-posts')
  @ResponseMessage('Posts fetched successfully.')
  async findAllPosts(): Promise<PostResponseDto[]> {
    return PostMapper.toResponseDtoList(await this.adminService.findAllPosts());
  }

  @Get('get-post/:slug')
  @ResponseMessage('Post fetched successfully')
  async findOneBySlug(
    @Param('slug') slug: string,
    @Req() req,
  ): Promise<PostResponseDto> {
    return PostMapper.toSingleResponseDto(
      await this.adminService.findOnePostBySlug(Number(req.user.id), slug),
    );
  }

  //ai-chats
  @Get('ai-sessions')
  @ResponseMessage('Chat sessions fetched successfully.')
  async getChatSessions(@Query() paginationQueryDto: PaginationQueryDto) {
    const data = await this.adminService.getAllChatSessions(paginationQueryDto);
    return data;
  }

  @Get('ai-history/:identifier')
  async getChatHistory(@Param('identifier') identifier: string) {
    return await this.adminService.getChatHistory(identifier);
  }
}

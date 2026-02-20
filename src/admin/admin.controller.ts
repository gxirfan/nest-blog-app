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
import { TagResponseDto } from 'src/forum/tags/dto/tag-response.dto';
import { TagMapper } from 'src/forum/tags/mappers/tag.mapper';
import { UpdateTagDto } from 'src/forum/tags/dto/update-tag.dto';
import { TopicResponseDto } from 'src/forum/topics/dto/topic-response.dto';
import { TopicMapper } from 'src/forum/topics/mappers/topic.mapper';
import { UpdateTopicDto } from 'src/forum/topics/dto/update-topic.dto';
import { PostMapper } from 'src/forum/posts/mappers/post.mapper';
import { AdminService } from './admin.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';
import { FlowMapper } from 'src/flow/mappers/flow.mapper';
import { ContactMapper } from 'src/contact/mappers/contact.mapper';
import { IBaseResponse } from 'src/common/interfaces/base-response.interface';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { ContactResponseDto } from 'src/contact/dto/contact-response.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/schemas/user.schema';

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
    return TagMapper.toResponseDto(await this.adminService.findAllTags());
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
  async tagDeleteOneById(@Param('id') id: string): Promise<TagResponseDto> {
    return TagMapper.toSingleResponseDto(
      await this.adminService.deleteTagById(id),
    );
  }

  //topic
  @Get('get-topics')
  @ResponseMessage('Topics fetched successfully.')
  async findAllTopics(): Promise<TopicResponseDto[]> {
    return TopicMapper.toResponseDto(await this.adminService.findAllTopics());
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
  async topicDeleteOneById(@Param('id') id: string): Promise<TopicResponseDto> {
    return TopicMapper.toSingleResponseDto(
      await this.adminService.deleteTopicById(id),
    );
  }

  //post
  @Delete('delete-post/:id')
  @ResponseMessage('Post deleted successfully.')
  async deletePost(@Param('id') id: string) {
    return PostMapper.toSingleResponseDto(
      await this.adminService.deletePostById(id),
    );
  }

  @Get('get-flow-posts')
  @ResponseMessage('Flow posts fetched successfully.')
  async findAllFlowPosts(@Query() paginationQueryDto: PaginationQueryDto) {
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
  ): Promise<IBaseResponse<IPaginationResponse<ContactResponseDto>>> {
    const result = await this.adminService.findAllContacts(paginationQueryDto);
    return {
      statusCode: 200,
      success: true,
      data: {
        data: ContactMapper.toResponseDto(result.data),
        meta: result.meta,
      },
    };
  }

  @Get('get-contact/:slug')
  @ResponseMessage('Contact fetched successfully.')
  async findOneContactBySlug(@Param('slug') slug: string) {
    return ContactMapper.toSingleResponseDto(
      await this.adminService.findOneContactBySlug(slug),
    );
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  Request,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import * as updateUserDto from './dto/update-user.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { UserResponseDto } from './dto/user-response.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadedFiles } from '@nestjs/common';
import { mediaUploadOptions } from 'src/common/utils/media-upload.utils';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Multer } from 'multer';
import { CensorInterceptor } from 'src/common/censor/censor.interceptor';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
@UseInterceptors(TransformInterceptor)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('public-profile/:username')
  @ResponseMessage('User found successfully.')
  async publicProfile(
    @Request() req,
  ): Promise<UserResponseDto & { isFollowing: boolean }> {
    return await this.userService.findOneByUsernameForPublicProfile(
      req.params.username,
      req.user?.id,
    );
  }

  @UseGuards(AuthenticatedGuard)
  @Patch('update')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @UseInterceptors(CensorInterceptor)
  @ResponseMessage('User updated successfully.')
  async update(
    @Request() req,
    @Body() user: updateUserDto.UpdateMeDto,
  ): Promise<UserResponseDto> {
    return await this.userService.update(Number(req.user.id), user);
  }

  @Patch('me/media')
  @UseGuards(AuthenticatedGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
      ],
      mediaUploadOptions,
    ),
  )
  @ResponseMessage('Media updated successfully.')
  async updateMedia(
    @UploadedFiles() files: { avatar?: Multer.File[]; cover?: Multer.File[] },
    @Request() req,
  ): Promise<{ avatarUrl: string | null; coverUrl: string | null }> {
    const userId = Number(req.user.id);
    const updatePayload: { avatar?: string; cover?: string } = {};

    if (files.avatar && files.avatar[0]) {
      updatePayload.avatar = `/images/user/avatars/${files.avatar[0].filename}`;
    }

    if (files.cover && files.cover[0]) {
      updatePayload.cover = `/images/user/covers/${files.cover[0].filename}`;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new HttpException(
        'No file uploaded or file names did not match expected fields (avatar/cover).',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedUser = await this.userService.updateUserMedia(
      userId,
      updatePayload,
    );

    return {
      avatarUrl: updatedUser.avatar,
      coverUrl: updatedUser.cover,
    };
  }

  @UseGuards(AuthenticatedGuard)
  @Patch('new-recovery-codes')
  @ResponseMessage('New recovery codes generated successfully.')
  async newRecoveryCodes(@Request() req): Promise<string[]> {
    return await this.userService.generateAndSaveRecoveryCodes(
      Number(req.user.id),
    );
  }

  @UseGuards(AuthenticatedGuard)
  @Patch('update-password')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ResponseMessage('Password updated successfully.')
  async updatePassword(
    @Request() req,
    @Body() user: updateUserDto.UpdateUserPasswordDto,
  ): Promise<UserResponseDto> {
    return await this.userService.updatePassword(Number(req.user.id), user);
  }

  @UseGuards(AuthenticatedGuard)
  @Patch('toggle-follow')
  @ResponseMessage('Follow status toggled successfully.')
  async toggleFollow(
    @Request() req,
    @Body('followingId') followingId: number,
  ): Promise<boolean> {
    return await this.userService.toggleFollow(
      Number(req.user.id),
      followingId,
    );
  }

  @Get(':username/followers')
  async getFollowers(
    @Param('username') username: string,
    @Req() req: any,
    @Query() query: PaginationQueryDto,
  ) {
    return await this.userService.findFollowers(
      username,
      req.user?.id,
      query.page || 1,
      query.limit || 10,
    );
  }

  @Get(':username/following')
  async getFollowing(
    @Param('username') username: string,
    @Req() req: any,
    @Query() query: PaginationQueryDto,
  ) {
    return await this.userService.findFollowing(
      username,
      req.user?.id,
      query.page || 1,
      query.limit || 10,
    );
  }
}

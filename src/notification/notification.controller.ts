import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { NotificationResponseDto } from './dto/notification.response.dto';
import { UseInterceptors } from '@nestjs/common';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';
import { NotificationMapper } from './mappers/notification.mapper';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';

@Controller('notifications')
@UseInterceptors(TransformInterceptor)
@UseGuards(AuthenticatedGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(
    @Req() req,
  ): Promise<IPaginationResponse<NotificationResponseDto>> {
    const rawData = await this.notificationService.getUserNotifications(
      Number(req.user.id),
    );
    return NotificationMapper.toPaginatedResponseDto(rawData);
  }

  @Get('all')
  async getUserNotificationsPaginated(
    @Req() req,
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginationResponse<NotificationResponseDto>> {
    const rawData =
      await this.notificationService.getUserNotificationsPaginated(
        Number(req.user.id),
        query,
      );
    return NotificationMapper.toPaginatedResponseDto(rawData);
  }

  @Patch(':id/read')
  async markAsRead(
    @Req() req,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    const result = await this.notificationService.markAsRead(
      Number(id),
      Number(req.user.id),
    );
    return NotificationMapper.toResponseDto(result);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req): Promise<NotificationResponseDto[]> {
    const result = await this.notificationService.markAllAsRead(
      Number(req.user.id),
    );
    return NotificationMapper.toArrayResponseDto(result);
  }
}

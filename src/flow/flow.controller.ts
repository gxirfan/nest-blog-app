import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  Param,
  Patch,
} from '@nestjs/common';
import { FlowService } from './flow.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { FlowMapper } from './mappers/flow.mapper';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { CensorInterceptor } from '../common/censor/censor.interceptor';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { FlowResponseDto } from './dto/flow-response.dto';
import { IPaginationResponse } from '../common/interfaces/pagination-response.interface';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/schemas/user.schema';

@UseInterceptors(TransformInterceptor)
@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.WRITER, UserRole.USER)
  @UseInterceptors(CensorInterceptor)
  @ResponseMessage('Flow created successfully.')
  async create(
    @Req() req,
    @Body() createFlowDto: CreateFlowDto,
  ): Promise<FlowResponseDto> {
    const doc = await this.flowService.create(req.user.id, createFlowDto);
    return FlowMapper.toResponseDto(doc);
  }

  @Get()
  @ResponseMessage('All flows fetched successfully.')
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginationResponse<FlowResponseDto>> {
    const result = await this.flowService.findAll(query);
    return {
      data: FlowMapper.toResponseDtoList(result.data),
      meta: result.meta,
    };
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string): Promise<FlowResponseDto> {
    const flow = await this.flowService.findBySlug(slug);
    return FlowMapper.toResponseDto(flow);
  }

  @Get(':slug/replies')
  async findReplies(
    @Param('slug') slug: string,
    @Query() query: PaginationQueryDto,
  ) {
    const flow = await this.flowService.findBySlug(slug);

    const result = await this.flowService.findReplies(
      flow._id.toString(),
      query,
    );
    return {
      data: FlowMapper.toResponseDtoList(result.data),
      meta: result.meta,
    };
  }

  @Patch(':slug')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.WRITER, UserRole.USER)
  @ResponseMessage('Flow updated successfully.')
  async update(
    @Param('slug') slug: string,
    @Body() updateFlowDto: UpdateFlowDto,
  ): Promise<FlowResponseDto> {
    const doc = await this.flowService.updateBySlug(slug, updateFlowDto);
    return FlowMapper.toResponseDto(doc);
  }

  @Get('username/:username')
  @ResponseMessage('Flows fetched successfully.')
  async findByUsername(
    @Param('username') username: string,
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginationResponse<FlowResponseDto>> {
    const result = await this.flowService.findByUsername(username, query);
    return {
      data: FlowMapper.toResponseDtoList(result.data),
      meta: result.meta,
    };
  }

  @Get('all/library/my-flows')
  @ResponseMessage('Flows fetched successfully.')
  async findAllForLibrary(
    @Req() req,
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginationResponse<FlowResponseDto>> {
    const result =
      await this.flowService.findAllByUserIdForLibraryMyFlowPostsPaginated(
        req.user.id,
        query,
      );
    return {
      data: FlowMapper.toResponseDtoList(result.data),
      meta: result.meta,
    };
  }
}

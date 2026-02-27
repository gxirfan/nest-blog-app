import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactService } from './contact.service';
import { AdminGuard } from 'src/admin/guards/admin.guard';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';
import { ContactMapper } from './mappers/contact.mapper';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ContactResponseDto } from './dto/contact-response.dto';

@UseInterceptors(TransformInterceptor)
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ResponseMessage('Contact message sent successfully')
  async handleContactSubmission(
    @Body() data: CreateContactDto,
  ): Promise<ContactResponseDto> {
    const result = await this.contactService.handleContactSubmission(data);
    return ContactMapper.toSingleResponseDto(result);
  }

  @UseGuards(AuthenticatedGuard, AdminGuard)
  @Get()
  @ResponseMessage('All contact messages retrieved successfully')
  async findAll(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<IPaginationResponse<ContactResponseDto>> {
    const paginatedData =
      await this.contactService.findAllPaginated(paginationQueryDto);
    return {
      data: ContactMapper.toResponseDtoList(paginatedData.data),
      meta: paginatedData.meta,
    };
  }

  @UseGuards(AuthenticatedGuard, AdminGuard)
  @Get(':id')
  @ResponseMessage('Contact message retrieved successfully')
  async findOneById(@Param('id') id: string): Promise<ContactResponseDto> {
    const result = await this.contactService.findOneById(Number(id));
    return ContactMapper.toSingleResponseDto(result);
  }

  @UseGuards(AuthenticatedGuard, AdminGuard)
  @Get('slug/:slug')
  @ResponseMessage('Contact message retrieved successfully')
  async findOneBySlug(
    @Param('slug') slug: string,
  ): Promise<ContactResponseDto> {
    return ContactMapper.toSingleResponseDto(
      await this.contactService.findOneBySlug(slug),
    );
  }
  @UseGuards(AuthenticatedGuard, AdminGuard)
  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ResponseMessage('Contact message updated successfully')
  async update(
    @Param('id') id: string,
    @Body() data: CreateContactDto,
  ): Promise<ContactResponseDto> {
    const result = await this.contactService.update(Number(id), data);
    return ContactMapper.toSingleResponseDto(result);
  }

  @UseGuards(AuthenticatedGuard, AdminGuard)
  @Delete(':id')
  @ResponseMessage('Contact message deleted successfully')
  async delete(@Param('id') id: string): Promise<ContactResponseDto> {
    const result = await this.contactService.delete(Number(id));
    return ContactMapper.toSingleResponseDto(result);
  }
}

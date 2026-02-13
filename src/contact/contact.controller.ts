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
import { IContactResponse } from './interfaces/contact.response.interface';
import { ContactMapper } from './mappers/contact.mapper';
import { IBaseResponse } from 'src/common/interfaces/base-response.interface';
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
    return ContactMapper.toSingleResponseDto(
      await this.contactService.handleContactSubmission(data),
    );
  }

  @UseGuards(AuthenticatedGuard, AdminGuard)
  @Get()
  @ResponseMessage('All contact messages retrieved successfully')
  async findAll(
    // Extract pagination parameters from the query string
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<IBaseResponse<IPaginationResponse<ContactResponseDto>>> {
    // Fetch paginated data from the service
    const paginatedData =
      await this.contactService.findAllPaginated(paginationQueryDto);

    // Map the documents to DTOs while preserving the pagination structure
    return {
      statusCode: 200,
      success: true,
      data: {
        data: ContactMapper.toResponseDto(paginatedData.data),
        meta: paginatedData.meta,
      },
    };
  }

  @UseGuards(AuthenticatedGuard, AdminGuard)
  @Get(':id')
  @ResponseMessage('Contact message retrieved successfully')
  async findOneById(@Param('id') id: string): Promise<ContactResponseDto> {
    return ContactMapper.toSingleResponseDto(
      await this.contactService.findOneById(id),
    );
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
    return ContactMapper.toSingleResponseDto(
      await this.contactService.update(id, data),
    );
  }

  @UseGuards(AuthenticatedGuard, AdminGuard)
  @Delete(':id')
  @ResponseMessage('Contact message deleted successfully')
  async delete(@Param('id') id: string): Promise<ContactResponseDto> {
    return ContactMapper.toSingleResponseDto(
      await this.contactService.delete(id),
    );
  }
}

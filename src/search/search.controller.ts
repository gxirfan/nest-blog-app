import {
  Controller,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  Get,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { SearchResultDto } from './dto/search-result.dto';
import type IRequestWithUser from 'src/common/interfaces/request-with-user.interface';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';

@UseInterceptors(TransformInterceptor)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ResponseMessage('Search results')
  @HttpCode(HttpStatus.OK)
  @Get()
  search(
    @Query() query: PaginationQueryDto,
    @Req() req: IRequestWithUser,
  ): Promise<IPaginationResponse<SearchResultDto>> {
    if (!query.q || query.q.length < 2) {
      throw new BadRequestException('Query must be at least 2 characters long');
    }
    return this.searchService.search({
      paginationQueryDto: query,
      userId: req.user?.id,
    });
  }

  // @Get()
  // findAll() {
  //   return this.searchService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.searchService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateSearchDto: UpdateSearchDto) {
  //   return this.searchService.update(+id, updateSearchDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.searchService.remove(+id);
  // }
}

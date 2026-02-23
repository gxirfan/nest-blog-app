import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { SearchResultDto } from '../dto/search-result.dto';
import { CreateSearchDto } from '../dto/create-search.dto';

export interface ISearchService {
  search(
    createSearchDto: CreateSearchDto,
  ): Promise<IPaginationResponse<SearchResultDto>>;

  // findAll(): Promise<IPaginationResponse<SearchResultDto>>;

  // findOne(id: string): Promise<SearchResultDto>;

  // update(
  //   id: string,
  //   updateSearchDto: CreateSearchDto,
  // ): Promise<SearchResultDto>;

  // remove(id: string): Promise<void>;
}

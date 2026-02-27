import { IsOptional, IsInt, Min, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @MinLength(2, { message: 'Query must be at least 2 characters long' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}

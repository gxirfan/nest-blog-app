import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFlowDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(500, { message: 'Flow content cannot exceed 500 characters.' })
  content: string;

  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, '-').toLowerCase();
  })
  slug?: string;
}

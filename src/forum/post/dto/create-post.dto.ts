import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  mainImage?: string;

  @IsString()
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000000)
  content: string;

  @IsInt()
  @IsNotEmpty()
  topicId: number;

  @IsInt()
  @IsOptional()
  parentId?: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, '-').toLowerCase();
  })
  slug?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoTags?: string[];
}

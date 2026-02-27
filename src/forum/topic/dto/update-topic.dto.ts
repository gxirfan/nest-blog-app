import {
  IsString,
  IsOptional,
  MinLength,
  IsDate,
  IsBoolean,
  IsNotEmpty,
  IsInt,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateTopicDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  @MinLength(1)
  title?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  @MinLength(1)
  content?: string;

  @IsInt()
  @IsOptional()
  tagId?: number;

  @IsInt()
  @IsOptional()
  postCount?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  lastPostAt?: Date;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, '-').toLowerCase();
  })
  slug?: string;

  @IsNotEmpty()
  @IsInt()
  userId: number;
}

import {
  IsString,
  IsOptional,
  MinLength,
  IsMongoId,
  IsNumber,
  IsDate,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';

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

  @IsMongoId()
  @IsOptional()
  tagId?: Types.ObjectId;

  @IsNumber()
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
  @IsMongoId()
  userId: Types.ObjectId;
}

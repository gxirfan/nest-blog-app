import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsMongoId,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateTopicDto {
  @IsNotEmpty({ message: 'Title is required.' })
  @IsString({ message: 'Title must be a string.' })
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, ' ');
  })
  @MinLength(5, { message: 'Title must be at least 5 characters long.' })
  @MaxLength(100, { message: 'Title must be at most 100 characters long.' })
  title: string;

  @IsNotEmpty({ message: 'Content is required.' })
  @IsString({ message: 'Content must be a string.' })
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  @MinLength(20, { message: 'Content must be at least 20 characters long.' })
  content: string;

  @IsNotEmpty()
  @IsMongoId()
  tagId: Types.ObjectId;

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

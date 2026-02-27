import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsInt,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
export class CreateTopicDto {
  @IsNotEmpty({ message: 'Title is required.' })
  @IsString({ message: 'Title must be a string.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @MinLength(5, { message: 'Title must be at least 5 characters long.' })
  @MaxLength(100, { message: 'Title must be at most 100 characters long.' })
  title: string;

  @IsNotEmpty({ message: 'Content is required.' })
  @IsString({ message: 'Content must be a string.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @MinLength(20, { message: 'Content must be at least 20 characters long.' })
  content: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt({ message: 'tagId must be an integer.' })
  tagId: number;
}

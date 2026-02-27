import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  @MinLength(3)
  title: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  @MinLength(3)
  description: string;
}

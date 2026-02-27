import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateTagDto {
  @IsString()
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  @IsOptional()
  @MinLength(1)
  title?: string;

  @IsString()
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  @IsOptional()
  @MinLength(1)
  description?: string;

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
}

import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  mainImage?: string | null;

  @IsString()
  @MinLength(1)
  @IsOptional()
  @MinLength(1)
  @MaxLength(5000000)
  content?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsString()
  @IsOptional()
  slug?: string;
}

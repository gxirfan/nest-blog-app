import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateFlowDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Flow content cannot exceed 500 characters.' })
  content?: string;

  @IsOptional()
  isDeleted?: boolean;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, '-').toLowerCase();
  })
  slug?: string;
}

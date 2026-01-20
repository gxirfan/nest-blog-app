import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFlowDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Flow content cannot exceed 500 characters.' })
  content?: string;

  @IsOptional()
  isDeleted?: boolean;

  @IsOptional()
  @IsString()
  slug?: string;
}

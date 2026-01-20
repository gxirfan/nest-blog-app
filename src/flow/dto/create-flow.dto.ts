import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsMongoId,
} from 'class-validator';

export class CreateFlowDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(500, { message: 'Flow content cannot exceed 500 characters.' })
  content: string;

  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @IsString()
  @MaxLength(500, { message: 'Flow content cannot exceed 500 characters.' })
  slug: string;
}

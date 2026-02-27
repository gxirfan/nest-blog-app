import { IsIn, IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { EntityType } from '../enums/entity-type.enum';

export class CreateVoteDto {
  @IsInt()
  @IsNotEmpty()
  postId: number;

  @IsIn(Object.values(EntityType))
  @IsNotEmpty()
  type: EntityType;

  @IsInt()
  @Min(-1)
  @Max(1)
  @IsNotEmpty()
  direction: number;
}

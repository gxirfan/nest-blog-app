import { IsIn, IsInt, IsNotEmpty } from 'class-validator';
import { EntityType } from '../enums/entity-type.enum';
import { Type } from 'class-transformer';

export class GetVoteStatusDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  postId: number;

  @IsIn(Object.values(EntityType))
  type: EntityType;
}

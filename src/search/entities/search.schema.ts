import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SearchLogDocument = HydratedDocument<SearchLog>;

@Schema({ timestamps: true })
export class SearchLog {
  @Prop({ required: true, index: true, lowercase: true, trim: true })
  query: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId;

  @Prop({ default: 1 })
  count: number;
}

export const SearchLogSchema = SchemaFactory.createForClass(SearchLog);
SearchLogSchema.index({ query: 1 });

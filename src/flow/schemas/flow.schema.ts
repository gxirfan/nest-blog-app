import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';
import { IFlow } from '../interfaces/flow.interface';

export type FlowDocument = IFlow & Document;

const flowDocumentToJsonTransformer = (doc, ret) => {
  if (ret._id?.toString()) {
    ret.id = ret._id.toString();
  }
  delete ret._id;
  delete ret.__v;
  return ret;
};

@Schema({
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: flowDocumentToJsonTransformer,
  },
})
export class Flow {
  @Prop({ unique: true, index: true })
  slug: string;

  @Prop({ required: true, maxlength: 500 })
  content: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  author: User;

  @Prop({ type: Types.ObjectId, ref: Flow.name, default: null })
  parentId: Types.ObjectId | null;

  @Prop({ default: 0 })
  replyCount: number;

  @Prop({ default: false })
  isDeleted: boolean;

  // @Prop({ default: 0 })
  // likeCount: number;
}

export const FlowSchema = SchemaFactory.createForClass(Flow);

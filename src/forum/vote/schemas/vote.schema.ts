import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EntityType } from '../enums/entity-type.enum';
import { User } from 'src/user/schemas/user.schema';
import { IVote } from '../interfaces/vote.interface';
import { Post } from 'src/forum/posts/schemas/post.schema';

export type VoteDocument = IVote & Document;

const voteDocumentToJsonTransformer = (doc, ret) => {
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
    toJSON: { virtuals: true, versionKey: false, transform: voteDocumentToJsonTransformer },
})
export class Vote {

    @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: Post.name, required: true, index: true })
    postId: Types.ObjectId;

    @Prop({ type: String, enum: Object.values(EntityType), required: true, index: true })
    type: EntityType;

    @Prop({ type: Number, required: true, enum: [-1, 1] })
    direction: number;
}

export const VoteSchema = SchemaFactory.createForClass(Vote);

VoteSchema.index({ userId: 1, postId: 1, type: 1 }, { unique: true });
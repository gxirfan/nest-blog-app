import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchLog, SearchLogSchema } from './entities/search.schema';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { Post, PostSchema } from 'src/forum/posts/schemas/post.schema';
import { Flow, FlowSchema } from 'src/flow/schemas/flow.schema';
import { Tag, TagSchema } from 'src/forum/tags/schemas/tag.schema';
import { Topic, TopicSchema } from 'src/forum/topics/schemas/topic.schema';

@Module({
  controllers: [SearchController],
  providers: [SearchService],
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: Flow.name, schema: FlowSchema },
      { name: Tag.name, schema: TagSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: SearchLog.name, schema: SearchLogSchema },
    ]),
  ],
})
export class SearchModule {}

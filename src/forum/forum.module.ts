import { Module } from '@nestjs/common';
import { TagsModule } from './tag/tags.module';
import { TopicsModule } from './topic/topics.module';
import { PostsModule } from './post/posts.module';

@Module({
  imports: [TagsModule, TopicsModule, PostsModule],
})
export class ForumModule {}

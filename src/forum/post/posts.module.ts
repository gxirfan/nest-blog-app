import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UserModule } from 'src/user/user.module';
import { TopicsModule } from 'src/forum/topic/topics.module';
import { CensorModule } from 'src/common/censor/censor.module';

@Module({
  providers: [PostsService],
  controllers: [PostsController],
  imports: [UserModule, TopicsModule, CensorModule],
  exports: [PostsService],
})
export class PostsModule {}

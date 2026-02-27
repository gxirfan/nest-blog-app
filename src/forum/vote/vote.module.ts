import { Module } from '@nestjs/common';
import { VoteService } from './vote.service';
import { VoteController } from './vote.controller';
import { UserModule } from 'src/user/user.module';
import { PostsModule } from '../post/posts.module';

@Module({
  imports: [UserModule, PostsModule],
  controllers: [VoteController],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {}

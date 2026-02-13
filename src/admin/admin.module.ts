import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from 'src/user/user.module';
import { TagsModule } from 'src/forum/tags/tags.module';
import { TopicsModule } from 'src/forum/topics/topics.module';
import { PostsModule } from 'src/forum/posts/posts.module';
import { FlowModule } from 'src/flow/flow.module';
import { ContactModule } from 'src/contact/contact.module';

@Module({
  providers: [AdminService],
  controllers: [AdminController],
  imports: [
    UserModule,
    TagsModule,
    TopicsModule,
    PostsModule,
    FlowModule,
    ContactModule,
  ],
})
export class AdminModule {}

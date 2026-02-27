import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { UserModule } from 'src/user/user.module';
import { TopicsController } from './topics.controller';
import { TagsModule } from '../tag/tags.module';
import { CensorModule } from 'src/common/censor/censor.module';

@Module({
  imports: [TagsModule, UserModule, CensorModule],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}

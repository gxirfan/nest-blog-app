import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { UserModule } from 'src/user/user.module';
import { CensorModule } from 'src/common/censor/censor.module';

@Module({
  imports: [UserModule, CensorModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}

import { Module } from '@nestjs/common';
import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';
import { CensorModule } from 'src/common/censor/censor.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [CensorModule, UserModule],
  controllers: [FlowController],
  providers: [FlowService],
  exports: [FlowService],
})
export class FlowModule {}

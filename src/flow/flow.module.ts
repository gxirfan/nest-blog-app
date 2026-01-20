import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';
import { Flow, FlowSchema } from './schemas/flow.schema';
import { CensorModule } from '../common/censor/censor.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Flow.name, schema: FlowSchema }]),
    CensorModule,
    UserModule,
  ],
  controllers: [FlowController],
  providers: [FlowService],
})
export class FlowModule {}

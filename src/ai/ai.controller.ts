import { Controller, Post, Body, Res } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body('messages') messages: any[], @Res() res: any) {
    const result = await this.aiService.generateChatStream(messages);

    result.pipeTextStreamToResponse(res);
  }
}

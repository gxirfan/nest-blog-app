import { Controller, Post, Body, Res, Req, Ip } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(
    @Body('messages') messages: any[],
    @Res() res: any,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    const user = (req as any).user;
    const identifier = user ? user.username : ip;
    const result = await this.aiService.generateChatStream(
      messages,
      identifier,
    );

    result.pipeTextStreamToResponse(res);
  }
}

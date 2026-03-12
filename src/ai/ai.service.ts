import { Injectable } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, ModelMessage, StreamTextResult } from 'ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private googleModel;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>(
      'GOOGLE_GENERATIVE_AI_API_KEY',
    );

    const googleProvider = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    this.googleModel = googleProvider('gemini-2.5-flash');
  }

  async generateChatStream(
    messages: ModelMessage[],
  ): Promise<StreamTextResult<any, any>> {
    const limitedMessages = messages.slice(-10);
    return streamText({
      model: this.googleModel,
      messages: limitedMessages,
      system: `${this.configService.get<string>('AI_SYSTEM_PROMPT')} Project name is ${this.configService.get<string>('PROJECT_NAME')}.`,
    });
  }
}

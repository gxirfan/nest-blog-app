import { Injectable } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, ModelMessage, StreamTextResult } from 'ai';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class AiService {
  private googleModel;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
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
    identifier: string,
  ): Promise<StreamTextResult<any, any>> {
    const limitedMessages = messages.slice(-10);

    const lastUserMessage = limitedMessages[limitedMessages.length - 1];

    await this.prisma.aiChatMessage.create({
      data: {
        identifier,
        role: 'user',
        content: lastUserMessage.content as string,
      },
    });

    return streamText({
      model: this.googleModel,
      messages: limitedMessages,
      system: `${this.configService.get<string>('AI_SYSTEM_PROMPT')} Project name is ${this.configService.get<string>('PROJECT_NAME')}.`,
      onFinish: async ({ text }) => {
        await this.prisma.aiChatMessage.create({
          data: {
            identifier,
            role: 'aiAssistant',
            content: text,
          },
        });
      },
    });
  }

  async getAllChatSessions(query: PaginationQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const allGroups = await this.prisma.aiChatMessage.groupBy({
      by: ['identifier'],
    });
    const total = allGroups.length;

    const sessions = await this.prisma.aiChatMessage.groupBy({
      by: ['identifier'],
      _max: {
        createdAt: true,
      },
      orderBy: {
        _max: { createdAt: 'desc' },
      },
      take: Number(limit),
      skip: skip,
    });

    return {
      data: sessions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getChatHistory(identifier: string) {
    return this.prisma.aiChatMessage.findMany({
      where: { identifier },
      orderBy: { createdAt: 'asc' },
    });
  }
}

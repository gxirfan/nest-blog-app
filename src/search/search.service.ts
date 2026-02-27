import { Injectable } from '@nestjs/common';
import { ISearchService } from './interfaces/search-service.interface';
import { SearchResultDto } from './dto/search-result.dto';
import { IPaginationResponse } from 'src/common/interfaces/pagination-response.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SearchService implements ISearchService {
  constructor(private readonly prisma: PrismaService) {}

  private async logSearch(query: string, userId?: number) {
    const lowerQuery = query.toLowerCase();

    await this.prisma.searchLog.upsert({
      where: { query: lowerQuery },
      update: {
        count: { increment: 1 },
        userId: userId || null,
      },
      create: {
        query: lowerQuery,
        userId: userId || null,
        count: 1,
      },
    });
  }

  async search(params: {
    paginationQueryDto: PaginationQueryDto;
    userId?: number;
  }): Promise<IPaginationResponse<SearchResultDto>> {
    const { paginationQueryDto, userId } = params;
    const query = paginationQueryDto.q;
    const { page = 1, limit = 10 } = paginationQueryDto;

    if (!query) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }

    void this.logSearch(query, userId);

    const searchFilter = {
      contains: query,
      mode: Prisma.QueryMode.insensitive,
    };

    const [users, posts, flows, tags, topics] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [{ username: searchFilter }, { nickname: searchFilter }],
        },
        take: Number(limit),
      }),
      this.prisma.post.findMany({
        where: { title: searchFilter, status: true },
        take: Number(limit),
      }),
      this.prisma.flow.findMany({
        where: { content: searchFilter, isDeleted: false },
        take: Number(limit),
      }),
      this.prisma.tag.findMany({
        where: { title: searchFilter, status: true },
        take: Number(limit),
      }),
      this.prisma.topic.findMany({
        where: { title: searchFilter, status: true },
        take: Number(limit),
      }),
    ]);

    const combinedResults: SearchResultDto[] = [
      ...users.map((u) => ({
        type: 'user' as const,
        id: u.id,
        title: u.username,
        subTitle: u.nickname,
        url: u.username,
        avatar: u.avatar ?? undefined,
      })),
      ...posts.map((p) => ({
        type: 'post' as const,
        id: p.id,
        title: p.title,
        url: p.slug,
      })),
      ...flows.map((f) => ({
        type: 'flow' as const,
        id: f.id,
        title: f.content.substring(0, 60),
        url: f.slug,
      })),
      ...tags.map((t) => ({
        type: 'tag' as const,
        id: t.id,
        title: `#${t.title}`,
        url: t.slug,
      })),
      ...topics.map((tp) => ({
        type: 'topic' as const,
        id: tp.id,
        title: tp.title,
        url: tp.slug,
      })),
    ];

    const total = combinedResults.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = combinedResults.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // findAll() {
  //   return `This action returns all search`;
  // }

  // findOne(id: string) {
  //   return `This action returns a #${id} search`;
  // }

  // update(id: string, updateSearchDto: CreateSearchDto) {
  //   return `This action updates a #${id} search`;
  // }

  // remove(id: string) {
  //   return `This action removes a #${id} search`;
  // }
}

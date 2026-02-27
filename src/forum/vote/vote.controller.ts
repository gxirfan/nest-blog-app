import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { VoteService } from './vote.service';
import { CreateVoteDto } from './dtos/create-vote.dto';
import { GetVoteStatusDto } from './dtos/get-vote-status.dto';
import { Vote } from '@prisma/client';

@UseInterceptors(TransformInterceptor)
@Controller('vote')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @UseGuards(AuthenticatedGuard)
  @Post()
  async createVote(
    @Req() req,
    @Body() voteDto: CreateVoteDto,
  ): Promise<Vote | null> {
    return this.voteService.createVote(Number(req.user.id), voteDto);
  }

  @UseGuards(AuthenticatedGuard)
  @Get()
  async findOneByUser(
    @Req() req,
    @Query() voteDto: GetVoteStatusDto,
  ): Promise<Vote | null> {
    const vote = await this.voteService.findOneByUser(
      Number(req.user.id),
      voteDto,
    );
    if (!vote) return null;
    return vote;
  }

  @UseGuards(AuthenticatedGuard)
  @Get('user-voted-post-list')
  async findUserVotedPostList(@Req() req): Promise<Vote[]> {
    return await this.voteService.findUserVotedPostList(Number(req.user.id));
  }
}

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { ElectionsService } from './elections.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VoteDto } from './dto/vote.dto';

@ApiTags('Elections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('elections')
export class ElectionsController {
  constructor(private electionsService: ElectionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List elections',
    description: 'Returns all active elections based on the current integration strategy',
  })
  getElections() {
    return this.electionsService.getElections();
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get vote history',
    description: 'Returns the current student\'s voting history',
  })
  getVoteHistory(@CurrentUser('id') userId: string) {
    return this.electionsService.getVoteHistory(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get election details',
    description: 'Returns election details with candidates',
  })
  getElectionById(@Param('id') id: string) {
    return this.electionsService.getElectionById(id);
  }

  @Get(':id/candidates')
  @ApiOperation({
    summary: 'Get candidates',
    description: 'Returns all candidates for a specific election',
  })
  getCandidates(@Param('id') id: string) {
    return this.electionsService.getCandidates(id);
  }

  @Get(':id/eligibility')
  @ApiOperation({
    summary: 'Check voting eligibility',
    description: 'Checks if the current student can vote in the specified election',
  })
  checkEligibility(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.electionsService.checkEligibility(id, userId);
  }

  @Post(':id/vote')
  @ApiOperation({
    summary: 'Cast vote',
    description: 'Cast a vote for a candidate in an election',
  })
  castVote(
    @Param('id') id: string,
    @Body() dto: VoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.electionsService.castVote(id, dto.candidateId, userId);
  }

  @Get(':id/results')
  @ApiOperation({
    summary: 'Get election results',
    description: 'Returns the results for a specific election',
  })
  getResults(@Param('id') id: string) {
    return this.electionsService.getResults(id);
  }
}

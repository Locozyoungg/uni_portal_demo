import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ElectionsService } from './elections.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExchangeTokenDto, ToggleModeDto } from './dto/vote.dto';

@ApiTags('Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integration')
export class IntegrationController {
  constructor(private electionsService: ElectionsService) {}

  @Post('auth/exchange')
  @ApiOperation({
    summary: 'Exchange portal JWT for voting JWT',
    description: 'Takes the current portal JWT and returns a short-lived voting JWT for UniElection',
  })
  exchangeJwt(@Body() dto: ExchangeTokenDto) {
    return this.electionsService.exchangeJwt(dto.token);
  }

  @Get('auth/verify')
  @ApiOperation({
    summary: 'Verify a voting JWT',
    description: 'Verifies that a voting JWT was issued by this portal and is still valid',
  })
  @ApiQuery({ name: 'token', required: true, description: 'The voting JWT to verify' })
  verifyVotingJwt(@Query('token') token: string) {
    return this.electionsService.verifyVotingJwt(token);
  }

  @Get('config')
  @ApiOperation({
    summary: 'Get integration configuration',
    description: 'Returns all integration configuration records',
  })
  getConfig() {
    return this.electionsService.getConfig();
  }

  @Get('logs')
  @ApiOperation({
    summary: 'Get integration logs',
    description: 'Paginated integration activity logs',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.electionsService.getIntegrationLogs(page, limit);
  }

  @Post('test/connectivity')
  @ApiOperation({
    summary: 'Test UniElection connectivity',
    description: 'Tests the connection to UniElection based on the current integration mode',
  })
  testConnectivity() {
    return this.electionsService.testConnectivity();
  }

  @Post('mock/toggle')
  @ApiOperation({
    summary: 'Toggle integration mode',
    description: 'Switch between mock, iframe, and SDK integration modes',
  })
  toggleMockMode(@Body() dto: ToggleModeDto) {
    return this.electionsService.toggleMode(dto.mode as any);
  }
}

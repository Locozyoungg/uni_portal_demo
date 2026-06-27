import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HostelService } from './hostel.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Hostel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hostel')
export class HostelController {
  constructor(private hostelService: HostelService) {}

  @Get('allocation')
  @ApiOperation({ summary: 'Get current hostel allocation for the student' })
  getAllocation(@CurrentUser() user: any) {
    return this.hostelService.getAllocation(user.id);
  }

  @Get('room')
  @ApiOperation({ summary: 'Get room details including roommates' })
  @ApiQuery({ name: 'roomId', required: true, type: String })
  getRoomDetails(
    @CurrentUser() user: any,
    @Query('roomId') roomId: string,
  ) {
    return this.hostelService.getRoomDetails(roomId);
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'Get maintenance requests for the student' })
  getMaintenanceRequests(@CurrentUser() user: any) {
    return this.hostelService.getMaintenanceRequests(user.id);
  }

  @Post('maintenance')
  @ApiOperation({ summary: 'Create a new maintenance request' })
  createMaintenanceRequest(
    @CurrentUser() user: any,
    @Body('roomId') roomId: string,
    @Body('issue') issue: string,
    @Body('priority') priority: string,
  ) {
    return this.hostelService.createMaintenanceRequest(
      user.id,
      roomId,
      issue,
      priority,
    );
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get hostel-related payments' })
  getHostelPayments(@CurrentUser() user: any) {
    return this.hostelService.getHostelPayments(user.id);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get hostel summary status for the student' })
  getHostelStatus(@CurrentUser() user: any) {
    return this.hostelService.getHostelStatus(user.id);
  }
}

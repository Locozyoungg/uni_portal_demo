import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  // ──────────────────────────────────────
  // Leave
  // ──────────────────────────────────────

  @Get('leave')
  @ApiOperation({ summary: 'Get all leave applications for the student' })
  getLeaveApplications(@CurrentUser() user: any) {
    return this.servicesService.getLeaveApplications(user.id);
  }

  @Post('leave')
  @ApiOperation({ summary: 'Create a new leave application' })
  createLeaveApplication(
    @CurrentUser() user: any,
    @Body('type') type: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Body('reason') reason: string,
  ) {
    return this.servicesService.createLeaveApplication(user.id, {
      type,
      startDate,
      endDate,
      reason,
    });
  }

  // ──────────────────────────────────────
  // Deferment
  // ──────────────────────────────────────

  @Get('deferment')
  @ApiOperation({ summary: 'Get all deferment requests for the student' })
  getDefermentRequests(@CurrentUser() user: any) {
    return this.servicesService.getDefermentRequests(user.id);
  }

  @Post('deferment')
  @ApiOperation({ summary: 'Create a new deferment request' })
  createDefermentRequest(
    @CurrentUser() user: any,
    @Body('reason') reason: string,
    @Body('semesterId') semesterId: string,
  ) {
    return this.servicesService.createDefermentRequest(
      user.id,
      reason,
      semesterId,
    );
  }

  // ──────────────────────────────────────
  // Transfer
  // ──────────────────────────────────────

  @Get('transfer')
  @ApiOperation({ summary: 'Get all transfer requests for the student' })
  getTransferRequests(@CurrentUser() user: any) {
    return this.servicesService.getTransferRequests(user.id);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Create a new programme transfer request' })
  createTransferRequest(
    @CurrentUser() user: any,
    @Body('fromProgrammeId') fromProgrammeId: string,
    @Body('toProgrammeId') toProgrammeId: string,
    @Body('reason') reason: string,
  ) {
    return this.servicesService.createTransferRequest(
      user.id,
      fromProgrammeId,
      toProgrammeId,
      reason,
    );
  }

  // ──────────────────────────────────────
  // Clearance & Disciplinary
  // ──────────────────────────────────────

  @Get('clearance')
  @ApiOperation({ summary: 'Get clearance status for the student' })
  getClearanceStatus(@CurrentUser() user: any) {
    return this.servicesService.getClearanceStatus(user.id);
  }

  @Get('disciplinary')
  @ApiOperation({ summary: 'Get disciplinary records for the student' })
  getDisciplinaryRecords(@CurrentUser() user: any) {
    return this.servicesService.getDisciplinaryRecords(user.id);
  }

  // ──────────────────────────────────────
  // Appointments
  // ──────────────────────────────────────

  @Get('appointments')
  @ApiOperation({ summary: 'Get all appointments for the student' })
  getAppointments(@CurrentUser() user: any) {
    return this.servicesService.getAppointments(user.id);
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Create a new appointment' })
  createAppointment(
    @CurrentUser() user: any,
    @Body('staffId') staffId: string,
    @Body('date') date: string,
    @Body('time') time: string,
    @Body('purpose') purpose: string,
  ) {
    return this.servicesService.createAppointment(
      user.id,
      staffId,
      date,
      time,
      purpose,
    );
  }

  // ──────────────────────────────────────
  // Counselling
  // ──────────────────────────────────────

  @Get('counselling')
  @ApiOperation({ summary: 'Get all counselling requests for the student' })
  getCounsellingRequests(@CurrentUser() user: any) {
    return this.servicesService.getCounsellingRequests(user.id);
  }

  @Post('counselling')
  @ApiOperation({ summary: 'Create a new counselling request' })
  createCounsellingRequest(
    @CurrentUser() user: any,
    @Body('type') type: string,
    @Body('description') description: string,
  ) {
    return this.servicesService.createCounsellingRequest(
      user.id,
      type,
      description,
    );
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AcademicsService } from './academics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Academics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academics')
export class AcademicsController {
  constructor(private academicsService: AcademicsService) {}

  @Get('courses')
  @ApiOperation({ summary: 'List all active courses' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async listCourses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.academicsService.listCourses(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('registered-units')
  @ApiOperation({ summary: 'Get registered units for current user' })
  @ApiQuery({ name: 'semesterId', required: false, type: String })
  async getRegisteredUnits(
    @CurrentUser() user: any,
    @Query('semesterId') semesterId?: string,
  ) {
    const student = await this.academicsService.getStudentByUserId(user.id);
    return this.academicsService.getRegisteredUnits(student.id, semesterId);
  }

  @Post('courses/register')
  @ApiOperation({ summary: 'Register for units' })
  async registerUnits(
    @CurrentUser() user: any,
    @Body() body: { courseIds: string[]; semesterId: string },
  ) {
    const student = await this.academicsService.getStudentByUserId(user.id);
    return this.academicsService.registerUnits(
      student.id,
      body.courseIds,
      body.semesterId,
    );
  }

  @Delete('registered-units/:id')
  @ApiOperation({ summary: 'Drop a registered unit' })
  @ApiParam({ name: 'id', description: 'StudentCourse record ID' })
  async dropUnit(@CurrentUser() user: any, @Param('id') id: string) {
    const student = await this.academicsService.getStudentByUserId(user.id);
    return this.academicsService.dropUnit(student.id, id);
  }

  @Get('results')
  @ApiOperation({ summary: 'Get exam results' })
  @ApiQuery({ name: 'semesterId', required: false, type: String })
  async getResults(
    @CurrentUser() user: any,
    @Query('semesterId') semesterId?: string,
  ) {
    const student = await this.academicsService.getStudentByUserId(user.id);
    return this.academicsService.getResults(student.id, semesterId);
  }

  @Get('transcript')
  @ApiOperation({ summary: 'Get transcript' })
  async getTranscript(@CurrentUser() user: any) {
    const student = await this.academicsService.getStudentByUserId(user.id);
    return this.academicsService.getTranscript(student.id);
  }

  @Get('exam-card')
  @ApiOperation({ summary: 'Get exam card' })
  @ApiQuery({ name: 'semesterId', required: false, type: String })
  async getExamCard(
    @CurrentUser() user: any,
    @Query('semesterId') semesterId?: string,
  ) {
    const student = await this.academicsService.getStudentByUserId(user.id);
    return this.academicsService.getExamCard(student.id, semesterId);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance summary' })
  async getAttendanceSummary(@CurrentUser() user: any) {
    const student = await this.academicsService.getStudentByUserId(user.id);
    return this.academicsService.getAttendanceSummary(student.id);
  }

  @Get('cgpa')
  @ApiOperation({ summary: 'Get CGPA history' })
  async getCgpaHistory(@CurrentUser() user: any) {
    const student = await this.academicsService.getStudentByUserId(user.id);
    return this.academicsService.getCgpaHistory(student.id);
  }

  @Get('course-history')
  @ApiOperation({ summary: 'Get course history across all semesters' })
  async getCourseHistory(@CurrentUser() user: any) {
    const student = await this.academicsService.getStudentByUserId(user.id);
    return this.academicsService.getCourseHistory(student.id);
  }

  @Get('graduation-progress')
  @ApiOperation({ summary: 'Get graduation progress' })
  async getGraduationProgress(@CurrentUser() user: any) {
    const student = await this.academicsService.getStudentByUserId(user.id);
    return this.academicsService.getGraduationProgress(student.id);
  }
}

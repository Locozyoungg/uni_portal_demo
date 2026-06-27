import {
  Controller,
  Get,
  Patch,
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
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all students',
    description: 'Paginated list of students with optional filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or admission number' })
  @ApiQuery({ name: 'facultyId', required: false, type: String })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'programmeId', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('facultyId') facultyId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('programmeId') programmeId?: string,
  ) {
    return this.studentsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search,
      facultyId,
      departmentId,
      programmeId,
    );
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard stats',
    description: 'Returns aggregated dashboard data for the authenticated student',
  })
  async getDashboard(@CurrentUser() user: any) {
    const student = await this.studentsService.findByUserId(user.sub);
    return this.studentsService.getDashboardStats(student.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  async findById(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }

  @Get('admission/:admissionNumber')
  @ApiOperation({ summary: 'Get student by admission number' })
  @ApiParam({ name: 'admissionNumber', description: 'Admission number (e.g., P100/1234/2023)' })
  async findByAdmissionNumber(@Param('admissionNumber') admissionNumber: string) {
    return this.studentsService.findByAdmissionNumber(admissionNumber);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update student profile' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  async updateProfile(
    @Param('id') id: string,
    @Body() data: { phone?: string; email?: string; emergencyContact?: string; photoUrl?: string },
  ) {
    return this.studentsService.updateProfile(id, data);
  }
}

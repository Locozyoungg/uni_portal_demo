import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
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
import { AdminService } from './admin.service';
import { ElectionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ==================== Dashboard ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard', description: 'Aggregated stats, charts, and activity for admin panel' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // ==================== Students ====================

  @Get('students')
  @ApiOperation({ summary: 'Get all students', description: 'Paginated list with search' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  getAllStudents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllStudents(page, limit, search);
  }

  @Get('students/:id')
  @ApiOperation({ summary: 'Get student by ID', description: 'Detailed student profile with all relations' })
  getStudentById(@Param('id') id: string) {
    return this.adminService.getStudentById(id);
  }

  @Patch('students/:id')
  @ApiOperation({ summary: 'Update student', description: 'Update student profile fields' })
  updateStudent(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateStudent(id, data);
  }

  @Delete('students/:id')
  @ApiOperation({ summary: 'Delete student', description: 'Permanently remove a student record' })
  deleteStudent(@Param('id') id: string) {
    return this.adminService.deleteStudent(id);
  }

  // ==================== Courses ====================

  @Get('courses')
  @ApiOperation({ summary: 'Get all courses', description: 'Paginated list with search' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  getAllCourses(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllCourses(page, limit, search);
  }

  @Post('courses')
  @ApiOperation({ summary: 'Create course' })
  createCourse(@Body() data: { code: string; name: string; credits: number; semester: number; year: number; departmentId: string }) {
    return this.adminService.createCourse(data);
  }

  @Patch('courses/:id')
  @ApiOperation({ summary: 'Update course' })
  updateCourse(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateCourse(id, data);
  }

  @Delete('courses/:id')
  @ApiOperation({ summary: 'Delete course' })
  deleteCourse(@Param('id') id: string) {
    return this.adminService.deleteCourse(id);
  }

  // ==================== Semesters ====================

  @Get('semesters')
  @ApiOperation({ summary: 'Get all semesters' })
  getAllSemesters() {
    return this.adminService.getAllSemesters();
  }

  @Post('semesters')
  @ApiOperation({ summary: 'Create semester' })
  createSemester(@Body() data: { name: string; year: number; startDate: string; endDate: string; registrationOpen?: boolean }) {
    return this.adminService.createSemester(data);
  }

  @Patch('semesters/:id')
  @ApiOperation({ summary: 'Update semester' })
  updateSemester(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateSemester(id, data);
  }

  @Patch('semesters/:id/current')
  @ApiOperation({ summary: 'Set current semester', description: 'Marks this semester as the current active semester' })
  setCurrentSemester(@Param('id') id: string) {
    return this.adminService.setCurrentSemester(id);
  }

  // ==================== Announcements ====================

  @Get('announcements')
  @ApiOperation({ summary: 'Get all announcements', description: 'Paginated list' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getAllAnnouncements(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAllAnnouncements(page, limit);
  }

  @Post('announcements')
  @ApiOperation({ summary: 'Create announcement' })
  createAnnouncement(@Body() data: any, @CurrentUser('id') userId: string) {
    return this.adminService.createAnnouncement({ ...data, createdBy: userId });
  }

  @Patch('announcements/:id')
  @ApiOperation({ summary: 'Update announcement' })
  updateAnnouncement(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateAnnouncement(id, data);
  }

  @Delete('announcements/:id')
  @ApiOperation({ summary: 'Delete announcement' })
  deleteAnnouncement(@Param('id') id: string) {
    return this.adminService.deleteAnnouncement(id);
  }

  // ==================== Elections ====================

  @Get('elections/config')
  @ApiOperation({ summary: 'Get election configurations', description: 'Returns all elections with visibility settings' })
  getElectionConfig() {
    return this.adminService.getElectionConfig();
  }

  @Patch('elections/config')
  @ApiOperation({ summary: 'Update election visibility', description: 'Update election visibility and status settings' })
  updateElectionConfig(@Body() data: { id: string; isVisible?: boolean; status?: ElectionStatus }) {
    return this.adminService.updateElectionConfig(data.id, data);
  }

  // ==================== Branding ====================

  @Get('branding')
  @ApiOperation({ summary: 'Get branding configuration' })
  getBranding() {
    return this.adminService.getBranding();
  }

  @Patch('branding')
  @ApiOperation({ summary: 'Update branding configuration' })
  updateBranding(@Body() data: any) {
    return this.adminService.updateBranding(data);
  }

  // ==================== Settings ====================

  @Get('settings')
  @ApiOperation({ summary: 'Get all settings', description: 'Aggregated SSO, integration, system, and API key settings' })
  async getSettings() {
    const [sso, branding, apiKeys] = await Promise.all([
      this.adminService.getSsoConfig(),
      this.adminService.getBranding(),
      this.adminService.getApiKeys(),
    ]);
    return {
      success: true,
      data: {
        sso: sso.data,
        branding: branding.data,
        integration: {
          mode: process.env.INTEGRATION_MODE || 'mock',
          apiUrl: process.env.UNIELECTION_API_URL || '',
          apiKey: '••••••••',
        },
        system: {
          jwtExpiration: process.env.JWT_EXPIRATION || '24h',
          corsOrigin: process.env.CORS_ORIGIN || '*',
          throttleLimit: process.env.THROTTLE_LIMIT || '100',
        },
        apiKeys: apiKeys.data,
      },
    };
  }

  // ==================== SSO ====================

  @Get('sso')
  @ApiOperation({ summary: 'Get SSO configuration' })
  getSsoConfig() {
    return this.adminService.getSsoConfig();
  }

  @Patch('sso')
  @ApiOperation({ summary: 'Update SSO configuration' })
  updateSsoConfig(@Body() data: any) {
    return this.adminService.updateSsoConfig(data);
  }

  // ==================== API Keys ====================

  @Get('api-keys')
  @ApiOperation({ summary: 'Get API keys', description: 'List all configured API keys' })
  getApiKeys() {
    return this.adminService.getApiKeys();
  }

  @Post('api-keys')
  @ApiOperation({ summary: 'Create API key', description: 'Generate a new API key' })
  createApiKey(@Body() data: { name: string }) {
    return this.adminService.createApiKey(data.name);
  }

  @Delete('api-keys/:id')
  @ApiOperation({ summary: 'Revoke API key', description: 'Delete an API key' })
  revokeApiKey(@Param('id') id: string) {
    return this.adminService.revokeApiKey(id);
  }

  // ==================== Logs ====================

  @Get('logs/audit')
  @ApiOperation({ summary: 'Get audit logs', description: 'Paginated audit log entries' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'entity', required: false })
  getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
  ) {
    return this.adminService.getAuditLogs(page, limit, userId, action, entity);
  }

  @Get('logs/integration')
  @ApiOperation({ summary: 'Get integration logs', description: 'Paginated integration log entries' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getIntegrationLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getIntegrationLogs(page, limit);
  }
}

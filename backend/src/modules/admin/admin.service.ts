import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ElectionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ==================== Students ====================

  async getAllStudents(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, email: true, isActive: true } },
          faculty: { select: { id: true, name: true } },
          school: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          programme: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      success: true,
      data: students,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStudentById(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, email: true, isActive: true } },
        faculty: true,
        school: true,
        department: true,
        programme: true,
        studentCourses: {
          include: {
            course: true,
            semester: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        academicRecords: {
          include: { semester: true },
          orderBy: { semester: { year: 'desc' } },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        voteRecords: {
          include: {
            election: { select: { id: true, title: true } },
            candidate: { select: { id: true, name: true, position: true } },
          },
          orderBy: { votedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return { success: true, data: student };
  }

  async updateStudent(id: string, data: any) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data,
    });

    return { success: true, data: updatedStudent };
  }

  async deleteStudent(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.student.delete({ where: { id } });

    return { success: true, message: 'Student deleted successfully' };
  }

  // ==================== Courses ====================

  async getAllCourses(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          _count: { select: { studentCourses: true } },
        },
        orderBy: { code: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      success: true,
      data: courses,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createCourse(data: {
    code: string;
    name: string;
    credits: number;
    semester: number;
    year: number;
    departmentId: string;
  }) {
    const existing = await this.prisma.course.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new BadRequestException(`Course with code "${data.code}" already exists`);
    }

    const course = await this.prisma.course.create({ data });
    return { success: true, data: course };
  }

  async updateCourse(id: string, data: any) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data,
    });

    return { success: true, data: updatedCourse };
  }

  async deleteCourse(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.prisma.course.delete({ where: { id } });
    return { success: true, message: 'Course deleted successfully' };
  }

  // ==================== Semesters ====================

  async getAllSemesters() {
    const semesters = await this.prisma.semester.findMany({
      orderBy: [{ year: 'desc' }, { name: 'desc' }],
    });

    return { success: true, data: semesters };
  }

  async createSemester(data: {
    name: string;
    year: number;
    startDate: string;
    endDate: string;
    registrationOpen?: boolean;
  }) {
    const semester = await this.prisma.semester.create({
      data: {
        name: data.name,
        year: data.year,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        registrationOpen: data.registrationOpen ?? false,
      },
    });

    return { success: true, data: semester };
  }

  async updateSemester(id: string, data: any) {
    const semester = await this.prisma.semester.findUnique({ where: { id } });
    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    const updatedSemester = await this.prisma.semester.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: updatedSemester };
  }

  async setCurrentSemester(id: string) {
    const semester = await this.prisma.semester.findUnique({ where: { id } });
    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    // Unset current for all semesters, then set the target
    await this.prisma.$transaction([
      this.prisma.semester.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      }),
      this.prisma.semester.update({
        where: { id },
        data: { isCurrent: true },
      }),
    ]);

    return { success: true, message: `Semester "${semester.name}" set as current` };
  }

  // ==================== Announcements ====================

  async getAllAnnouncements(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.announcement.count(),
    ]);

    return {
      success: true,
      data: announcements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
    targetRole?: string;
    targetFaculty?: string;
    targetDepartment?: string;
    priority?: string;
    expiresAt?: string;
    createdBy: string;
  }) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        targetRole: data.targetRole as any,
        targetFaculty: data.targetFaculty,
        targetDepartment: data.targetDepartment,
        priority: data.priority ?? 'NORMAL',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdBy: data.createdBy,
      },
    });

    return { success: true, data: announcement };
  }

  async updateAnnouncement(id: string, data: any) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    const updateData: any = { ...data };
    if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt);

    const updatedAnnouncement = await this.prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: updatedAnnouncement };
  }

  async deleteAnnouncement(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    await this.prisma.announcement.delete({ where: { id } });
    return { success: true, message: 'Announcement deleted successfully' };
  }

  // ==================== Election Config ====================

  async getElectionConfig() {
    const elections = await this.prisma.election.findMany({
      include: {
        _count: {
          select: { candidates: true, voteRecords: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return { success: true, data: elections };
  }

  async updateElectionConfig(id: string, data: { isVisible?: boolean; status?: ElectionStatus }) {
    const election = await this.prisma.election.findUnique({ where: { id } });
    if (!election) {
      throw new NotFoundException('Election not found');
    }

    const updatedElection = await this.prisma.election.update({
      where: { id },
      data,
    });

    return { success: true, data: updatedElection };
  }

  // ==================== Branding ====================

  async getBranding() {
    const branding = await this.prisma.integrationConfig.findMany({
      where: {
        name: { in: ['BRANDING_UNIVERSITY_NAME', 'BRANDING_LOGO_URL', 'BRANDING_PRIMARY_COLOR', 'BRANDING_SECONDARY_COLOR', 'BRANDING_ACCENT_COLOR', 'BRANDING_FONT_FAMILY', 'BRANDING_DARK_MODE', 'BRANDING_LIGHT_MODE'] },
      },
    });

    const brandingMap: Record<string, string> = {};
    for (const config of branding) {
      const key = config.name.replace('BRANDING_', '').toLowerCase();
      brandingMap[key] = config.value;
    }

    return {
      success: true,
      data: {
        universityName: brandingMap['university_name'] || 'Demo University',
        logoUrl: brandingMap['logo_url'] || null,
        primaryColor: brandingMap['primary_color'] || '#1a56db',
        secondaryColor: brandingMap['secondary_color'] || '#7c3aed',
        accentColor: brandingMap['accent_color'] || '#06b6d4',
        fontFamily: brandingMap['font_family'] || 'Inter',
        darkModeEnabled: brandingMap['dark_mode'] !== 'false',
        lightModeEnabled: brandingMap['light_mode'] !== 'false',
      },
    };
  }

  async updateBranding(data: {
    universityName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    darkModeEnabled?: boolean;
    lightModeEnabled?: boolean;
  }) {
    const updates: { name: string; value: string }[] = [];

    if (data.universityName !== undefined) updates.push({ name: 'BRANDING_UNIVERSITY_NAME', value: data.universityName });
    if (data.logoUrl !== undefined) updates.push({ name: 'BRANDING_LOGO_URL', value: data.logoUrl });
    if (data.primaryColor !== undefined) updates.push({ name: 'BRANDING_PRIMARY_COLOR', value: data.primaryColor });
    if (data.secondaryColor !== undefined) updates.push({ name: 'BRANDING_SECONDARY_COLOR', value: data.secondaryColor });
    if (data.accentColor !== undefined) updates.push({ name: 'BRANDING_ACCENT_COLOR', value: data.accentColor });
    if (data.fontFamily !== undefined) updates.push({ name: 'BRANDING_FONT_FAMILY', value: data.fontFamily });
    if (data.darkModeEnabled !== undefined) updates.push({ name: 'BRANDING_DARK_MODE', value: String(data.darkModeEnabled) });
    if (data.lightModeEnabled !== undefined) updates.push({ name: 'BRANDING_LIGHT_MODE', value: String(data.lightModeEnabled) });

    for (const update of updates) {
      await this.prisma.integrationConfig.upsert({
        where: { name: update.name },
        create: { name: update.name, value: update.value },
        update: { value: update.value },
      });
    }

    return this.getBranding();
  }

  // ==================== SSO ====================

  async getSsoConfig() {
    const configs = await this.prisma.integrationConfig.findMany({
      where: {
        name: { in: ['SSO_PROVIDER', 'SSO_CLIENT_ID', 'SSO_AUTHORIZE_URL', 'SSO_TOKEN_URL', 'SSO_USERINFO_URL', 'SSO_ENABLED'] },
      },
    });

    const configMap: Record<string, string> = {};
    for (const config of configs) {
      const key = config.name.replace('SSO_', '').toLowerCase();
      configMap[key] = config.value;
    }

    return {
      success: true,
      data: {
        enabled: configMap['enabled'] === 'true',
        provider: configMap['provider'] || '',
        clientId: configMap['client_id'] || '',
        authorizeUrl: configMap['authorize_url'] || '',
        tokenUrl: configMap['token_url'] || '',
        userInfoUrl: configMap['userinfo_url'] || '',
      },
    };
  }

  async updateSsoConfig(data: {
    enabled?: boolean;
    provider?: string;
    clientId?: string;
    authorizeUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
  }) {
    const updates: { name: string; value: string }[] = [];

    if (data.enabled !== undefined) updates.push({ name: 'SSO_ENABLED', value: String(data.enabled) });
    if (data.provider !== undefined) updates.push({ name: 'SSO_PROVIDER', value: data.provider });
    if (data.clientId !== undefined) updates.push({ name: 'SSO_CLIENT_ID', value: data.clientId });
    if (data.authorizeUrl !== undefined) updates.push({ name: 'SSO_AUTHORIZE_URL', value: data.authorizeUrl });
    if (data.tokenUrl !== undefined) updates.push({ name: 'SSO_TOKEN_URL', value: data.tokenUrl });
    if (data.userInfoUrl !== undefined) updates.push({ name: 'SSO_USERINFO_URL', value: data.userInfoUrl });

    for (const update of updates) {
      await this.prisma.integrationConfig.upsert({
        where: { name: update.name },
        create: { name: update.name, value: update.value },
        update: { value: update.value },
      });
    }

    return this.getSsoConfig();
  }

  // ==================== API Keys ====================

  async getApiKeys() {
    const keys = await this.prisma.integrationConfig.findMany({
      where: {
        name: { startsWith: 'API_KEY_' },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: keys };
  }

  async createApiKey(name: string) {
    const keyName = `API_KEY_${name.toUpperCase().replace(/\s+/g, '_')}`;
    const apiKey = `kup_${uuidv4().replace(/-/g, '')}`;

    await this.prisma.integrationConfig.create({
      data: {
        name: keyName,
        value: apiKey,
        isEncrypted: true,
      },
    });

    return {
      success: true,
      data: { name: keyName, key: apiKey },
      message: 'Make sure to copy the API key now. It will not be shown again.',
    };
  }

  async revokeApiKey(id: string) {
    const key = await this.prisma.integrationConfig.findUnique({
      where: { id },
    });

    if (!key || !key.name.startsWith('API_KEY_')) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.integrationConfig.delete({ where: { id } });

    return { success: true, message: 'API key revoked successfully' };
  }

  // ==================== Audit Logs ====================

  async getAuditLogs(
    page = 1,
    limit = 20,
    userId?: string,
    action?: string,
    entity?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      success: true,
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getIntegrationLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.integrationLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.integrationLog.count(),
    ]);

    return {
      success: true,
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}

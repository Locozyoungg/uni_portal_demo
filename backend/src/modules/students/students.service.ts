import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    facultyId?: string,
    departmentId?: string,
    programmeId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (facultyId) where.facultyId = facultyId;
    if (departmentId) where.departmentId = departmentId;
    if (programmeId) where.programmeId = programmeId;

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, email: true, role: true, isActive: true } },
          faculty: true,
          school: true,
          department: true,
          programme: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, email: true, role: true, isActive: true } },
        faculty: true,
        school: true,
        department: true,
        programme: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return { success: true, data: student };
  }

  async findByAdmissionNumber(admissionNumber: string) {
    const student = await this.prisma.student.findUnique({
      where: { admissionNumber },
      include: {
        user: { select: { id: true, username: true, email: true, role: true, isActive: true } },
        faculty: true,
        school: true,
        department: true,
        programme: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return { success: true, data: student };
  }

  async findByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found for this user');
    }

    return student;
  }

  async updateProfile(id: string, data: {
    phone?: string;
    email?: string;
    emergencyContact?: string;
    photoUrl?: string;
  }) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Student not found');
    }

    const student = await this.prisma.student.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, username: true, email: true, role: true, isActive: true } },
        faculty: true,
        school: true,
        department: true,
        programme: true,
      },
    });

    return { success: true, data: student };
  }

  async getDashboardStats(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        academicRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { semester: true },
        },
        feeStatements: {
          orderBy: { generatedAt: 'desc' },
          take: 1,
        },
        allocations: {
          where: { status: 'ACTIVE' },
          include: { room: { include: { hostel: true } } },
          take: 1,
        },
        borrowRecords: {
          where: { status: 'BORROWED' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Current semester
    const currentSemester = await this.prisma.semester.findFirst({
      where: { isCurrent: true },
    });

    // Registered units count for current semester
    const registeredUnitsCount = currentSemester
      ? await this.prisma.studentCourse.count({
          where: {
            studentId,
            semesterId: currentSemester.id,
            status: { in: ['REGISTERED', 'IN_PROGRESS'] },
          },
        })
      : 0;

    // Active elections count
    const activeElectionsCount = await this.prisma.election.count({
      where: {
        status: 'ACTIVE',
        isVisible: true,
      },
    });

    // Unread notifications
    const unreadNotifications = await this.prisma.notification.count({
      where: {
        userId: student.userId,
        isRead: false,
      },
    });

    // Upcoming events (announcements)
    const upcomingEvents = await this.prisma.announcement.findMany({
      where: {
        publishedAt: { lte: new Date() },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    const latestAcademicRecord = student.academicRecords[0] ?? null;
    const latestFeeStatement = student.feeStatements[0] ?? null;
    const hostelAllocation = student.allocations[0] ?? null;

    return {
      success: true,
      data: {
        currentSemester: currentSemester ?? null,
        registeredUnitsCount,
        outstandingFeesBalance: latestFeeStatement?.balance ?? 0,
        academicStatus: latestAcademicRecord
          ? {
              gpa: latestAcademicRecord.gpa,
              cgpa: latestAcademicRecord.cgpa,
              totalCredits: latestAcademicRecord.totalCredits,
              semester: latestAcademicRecord.semester,
            }
          : null,
        activeElectionsCount,
        borrowedBooksCount: student.borrowRecords.length,
        hostelAllocation: hostelAllocation
          ? {
              bedNumber: hostelAllocation.bedNumber,
              roomNumber: hostelAllocation.room.number,
              hostelName: hostelAllocation.room.hostel.name,
              block: hostelAllocation.room.hostel.block,
            }
          : null,
        unreadNotificationsCount: unreadNotifications,
        upcomingEvents,
      },
    };
  }
}

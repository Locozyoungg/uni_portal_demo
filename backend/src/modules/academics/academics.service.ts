import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AcademicsService {
  constructor(private prisma: PrismaService) {}

  async getStudentByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) {
      throw new NotFoundException('Student profile not found for this user');
    }
    return student;
  }

  async listCourses(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        include: { department: true },
        orderBy: { code: 'asc' },
      }),
      this.prisma.course.count({ where: { isActive: true } }),
    ]);

    return {
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRegisteredUnits(studentId: string, semesterId?: string) {
    const where: any = { studentId, status: { not: 'DROPPED' } };
    if (semesterId) where.semesterId = semesterId;

    const units = await this.prisma.studentCourse.findMany({
      where,
      include: {
        course: true,
        semester: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: units };
  }

  async registerUnits(studentId: string, courseIds: string[], semesterId: string) {
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!semester) {
      throw new BadRequestException('Semester not found');
    }

    if (!semester.registrationOpen) {
      throw new BadRequestException('Registration is not open for this semester');
    }

    const registrations = await Promise.all(
      courseIds.map(async (courseId) => {
        const course = await this.prisma.course.findUnique({
          where: { id: courseId },
        });

        if (!course) {
          throw new BadRequestException(`Course ${courseId} not found`);
        }

        // Check for duplicate
        const existing = await this.prisma.studentCourse.findUnique({
          where: {
            studentId_courseId_semesterId: {
              studentId,
              courseId,
              semesterId,
            },
          },
        });

        if (existing) {
          if (existing.status === 'DROPPED') {
            // Re-register if previously dropped
            return this.prisma.studentCourse.update({
              where: { id: existing.id },
              data: { status: 'REGISTERED' },
              include: { course: true, semester: true },
            });
          }
          throw new BadRequestException(
            `Course ${course.code} is already registered for this semester`,
          );
        }

        return this.prisma.studentCourse.create({
          data: {
            studentId,
            courseId,
            semesterId,
            status: 'REGISTERED',
          },
          include: { course: true, semester: true },
        });
      }),
    );

    return { success: true, data: registrations };
  }

  async dropUnit(studentId: string, studentCourseId: string) {
    const record = await this.prisma.studentCourse.findUnique({
      where: { id: studentCourseId },
    });

    if (!record) {
      throw new NotFoundException('Registration record not found');
    }

    if (record.studentId !== studentId) {
      throw new BadRequestException('This unit registration does not belong to you');
    }

    if (record.status === 'DROPPED') {
      throw new BadRequestException('Unit is already dropped');
    }

    if (record.status === 'COMPLETED' || record.status === 'FAILED') {
      throw new BadRequestException('Cannot drop a unit that has already been completed');
    }

    const updated = await this.prisma.studentCourse.update({
      where: { id: studentCourseId },
      data: { status: 'DROPPED' },
      include: { course: true, semester: true },
    });

    return { success: true, data: updated };
  }

  async getResults(studentId: string, semesterId?: string) {
    const where: any = {
      studentId,
      status: { in: ['COMPLETED', 'FAILED'] },
    };

    if (semesterId) where.semesterId = semesterId;

    const results = await this.prisma.studentCourse.findMany({
      where,
      include: {
        course: true,
        semester: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: results };
  }

  async getTranscript(studentId: string) {
    const transcript = await this.prisma.transcript.findFirst({
      where: { studentId },
      orderBy: { issuedAt: 'desc' },
    });

    if (!transcript) {
      throw new NotFoundException('No transcript found');
    }

    return { success: true, data: transcript };
  }

  async getExamCard(studentId: string, semesterId?: string) {
    const where: any = { studentId };
    if (semesterId) {
      where.semesterId = semesterId;
    } else {
      const currentSemester = await this.prisma.semester.findFirst({
        where: { isCurrent: true },
      });
      if (!currentSemester) {
        throw new NotFoundException('No active semester found');
      }
      where.semesterId = currentSemester.id;
    }

    const examCard = await this.prisma.examCard.findFirst({
      where,
      include: { semester: true },
      orderBy: { issuedAt: 'desc' },
    });

    if (!examCard) {
      throw new NotFoundException('Exam card not found for the specified semester');
    }

    return { success: true, data: examCard };
  }

  async getAttendanceSummary(studentId: string) {
    const records = await this.prisma.studentCourse.findMany({
      where: { studentId },
      include: {
        course: true,
        semester: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: records };
  }

  async getCgpaHistory(studentId: string) {
    const records = await this.prisma.academicRecord.findMany({
      where: { studentId },
      include: { semester: true },
      orderBy: { semester: { year: 'asc' } },
    });

    return { success: true, data: records };
  }

  async getCourseHistory(studentId: string) {
    const records = await this.prisma.studentCourse.findMany({
      where: { studentId },
      include: {
        course: true,
        semester: true,
      },
      orderBy: [{ semester: { year: 'desc' } }, { semester: { startDate: 'desc' } }],
    });

    return { success: true, data: records };
  }

  async getGraduationProgress(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { programme: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Sum completed credits from courses with COMPLETED status
    const completedCourses = await this.prisma.studentCourse.findMany({
      where: {
        studentId,
        status: 'COMPLETED',
      },
      include: { course: true },
    });

    const completedCredits = completedCourses.reduce(
      (sum, sc) => sum + sc.course.credits,
      0,
    );

    // Calculate required credits based on programme duration
    // Assuming average 30 credits per year
    const requiredCredits = student.programme.durationYears * 30;
    const progress = requiredCredits > 0 ? Math.round((completedCredits / requiredCredits) * 100) : 0;

    return {
      success: true,
      data: {
        completedCredits,
        requiredCredits,
        progressPercentage: progress,
        programme: student.programme,
        remainingCredits: Math.max(0, requiredCredits - completedCredits),
      },
    };
  }
}

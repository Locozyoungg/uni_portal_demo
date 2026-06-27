import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  private async getStudentByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new NotFoundException('Student record not found');
    }
    return student;
  }

  // ──────────────────────────────────────
  // Leave Applications
  // ──────────────────────────────────────

  async getLeaveApplications(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const leaves = await this.prisma.leaveApplication.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: leaves };
  }

  async createLeaveApplication(
    userId: string,
    data: { type: string; startDate: string; endDate: string; reason: string },
  ) {
    const student = await this.getStudentByUserId(userId);

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    const leave = await this.prisma.leaveApplication.create({
      data: {
        studentId: student.id,
        type: data.type,
        startDate: start,
        endDate: end,
        reason: data.reason,
        status: 'PENDING',
      },
    });

    return { success: true, data: leave };
  }

  // ──────────────────────────────────────
  // Deferment Requests
  // ──────────────────────────────────────

  async getDefermentRequests(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const requests = await this.prisma.defermentRequest.findMany({
      where: { studentId: student.id },
      include: {
        semester: {
          select: { id: true, name: true, year: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: requests };
  }

  async createDefermentRequest(
    userId: string,
    reason: string,
    semesterId: string,
  ) {
    const student = await this.getStudentByUserId(userId);

    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });
    if (!semester) {
      throw new BadRequestException('Semester not found');
    }

    const request = await this.prisma.defermentRequest.create({
      data: {
        studentId: student.id,
        reason,
        semesterId,
        status: 'PENDING',
      },
      include: {
        semester: {
          select: { id: true, name: true, year: true },
        },
      },
    });

    return { success: true, data: request };
  }

  // ──────────────────────────────────────
  // Transfer Requests
  // ──────────────────────────────────────

  async getTransferRequests(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const requests = await this.prisma.transferRequest.findMany({
      where: { studentId: student.id },
      include: {
        fromProgramme: {
          select: { id: true, name: true, code: true },
        },
        toProgramme: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: requests };
  }

  async createTransferRequest(
    userId: string,
    fromProgrammeId: string,
    toProgrammeId: string,
    reason: string,
  ) {
    const student = await this.getStudentByUserId(userId);

    const [fromProgramme, toProgramme] = await Promise.all([
      this.prisma.programme.findUnique({ where: { id: fromProgrammeId } }),
      this.prisma.programme.findUnique({ where: { id: toProgrammeId } }),
    ]);

    if (!fromProgramme) {
      throw new BadRequestException('Source programme not found');
    }
    if (!toProgramme) {
      throw new BadRequestException('Target programme not found');
    }
    if (fromProgrammeId === toProgrammeId) {
      throw new BadRequestException('Target programme must differ from current programme');
    }

    const request = await this.prisma.transferRequest.create({
      data: {
        studentId: student.id,
        fromProgrammeId,
        toProgrammeId,
        reason,
        status: 'PENDING',
      },
      include: {
        fromProgramme: {
          select: { id: true, name: true, code: true },
        },
        toProgramme: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return { success: true, data: request };
  }

  // ──────────────────────────────────────
  // Clearance
  // ──────────────────────────────────────

  async getClearanceStatus(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const clearances = await this.prisma.clearance.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: clearances };
  }

  // ──────────────────────────────────────
  // Disciplinary Records
  // ──────────────────────────────────────

  async getDisciplinaryRecords(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const records = await this.prisma.disciplinaryRecord.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
    });
    return { success: true, data: records };
  }

  // ──────────────────────────────────────
  // Appointments
  // ──────────────────────────────────────

  async getAppointments(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const appointments = await this.prisma.appointment.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
    });
    return { success: true, data: appointments };
  }

  async createAppointment(
    userId: string,
    staffId: string,
    date: string,
    time: string,
    purpose: string,
  ) {
    const student = await this.getStudentByUserId(userId);

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        studentId: student.id,
        staffId,
        date: appointmentDate,
        time,
        purpose,
        status: 'SCHEDULED',
      },
    });

    return { success: true, data: appointment };
  }

  // ──────────────────────────────────────
  // Counselling Requests
  // ──────────────────────────────────────

  async getCounsellingRequests(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const requests = await this.prisma.counsellingRequest.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: requests };
  }

  async createCounsellingRequest(
    userId: string,
    type: string,
    description: string,
  ) {
    const student = await this.getStudentByUserId(userId);

    const request = await this.prisma.counsellingRequest.create({
      data: {
        studentId: student.id,
        type,
        description,
        status: 'PENDING',
      },
    });

    return { success: true, data: request };
  }
}

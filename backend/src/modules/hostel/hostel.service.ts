import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HostelService {
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

  async getAllocation(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const allocation = await this.prisma.allocation.findFirst({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
      },
      include: {
        room: {
          include: {
            hostel: true,
          },
        },
      },
    });

    if (!allocation) {
      return { success: true, data: null };
    }

    return { success: true, data: allocation };
  }

  async getRoomDetails(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        hostel: true,
        allocations: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNumber: true,
                phone: true,
                programme: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return { success: true, data: room };
  }

  async getMaintenanceRequests(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const requests = await this.prisma.maintenanceRequest.findMany({
      where: { studentId: student.id },
      include: {
        room: {
          select: {
            id: true,
            number: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: requests };
  }

  async createMaintenanceRequest(
    userId: string,
    roomId: string,
    issue: string,
    priority: string,
  ) {
    const student = await this.getStudentByUserId(userId);

    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new BadRequestException('Room not found');
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const normalizedPriority = priority?.toUpperCase();
    if (!validPriorities.includes(normalizedPriority)) {
      throw new BadRequestException(
        'Invalid priority. Must be one of: LOW, MEDIUM, HIGH, CRITICAL',
      );
    }

    const request = await this.prisma.maintenanceRequest.create({
      data: {
        studentId: student.id,
        roomId,
        issue,
        priority: normalizedPriority,
        status: 'PENDING',
      },
      include: {
        room: {
          select: { number: true },
        },
      },
    });

    return { success: true, data: request };
  }

  async getHostelPayments(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const payments = await this.prisma.payment.findMany({
      where: { studentId: student.id },
      include: {
        invoice: {
          select: {
            id: true,
            amount: true,
            dueDate: true,
            status: true,
            items: true,
            semester: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    const hostelPayments = payments.filter((p) => {
      const items = p.invoice.items;
      if (!items) return false;
      const raw = typeof items === 'string' ? items : JSON.stringify(items);
      return raw.toLowerCase().includes('hostel');
    });

    return { success: true, data: hostelPayments };
  }

  async getHostelStatus(userId: string) {
    const student = await this.getStudentByUserId(userId);

    const allocation = await this.prisma.allocation.findFirst({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
      },
      include: {
        room: {
          include: {
            hostel: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!allocation) {
      return {
        success: true,
        data: {
          allocated: false,
          hostelName: null,
          roomNumber: null,
          pendingMaintenanceCount: 0,
        },
      };
    }

    const pendingCount = await this.prisma.maintenanceRequest.count({
      where: {
        studentId: student.id,
        status: 'PENDING',
      },
    });

    return {
      success: true,
      data: {
        allocated: true,
        hostelName: allocation.room.hostel.name,
        roomNumber: allocation.room.number,
        pendingMaintenanceCount: pendingCount,
      },
    };
  }
}

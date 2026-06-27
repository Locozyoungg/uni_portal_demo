import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LibraryService {
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

  async getBorrowedBooks(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const records = await this.prisma.borrowRecord.findMany({
      where: {
        studentId: student.id,
        status: { in: ['BORROWED', 'OVERDUE'] },
      },
      include: {
        book: {
          select: {
            id: true,
            isbn: true,
            title: true,
            author: true,
            publisher: true,
            category: true,
          },
        },
      },
      orderBy: { borrowedAt: 'desc' },
    });
    return { success: true, data: records };
  }

  async getFines(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const records = await this.prisma.borrowRecord.findMany({
      where: {
        studentId: student.id,
        fine: { gt: 0 },
      },
      include: {
        book: {
          select: {
            id: true,
            isbn: true,
            title: true,
            author: true,
          },
        },
      },
      orderBy: { borrowedAt: 'desc' },
    });
    return { success: true, data: records };
  }

  async getReservations(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const reservations = await this.prisma.reservation.findMany({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
      },
      include: {
        book: {
          select: {
            id: true,
            isbn: true,
            title: true,
            author: true,
            category: true,
          },
        },
      },
      orderBy: { reservedAt: 'desc' },
    });
    return { success: true, data: reservations };
  }

  async getDigitalResources(category?: string) {
    const where = category ? { category } : {};
    const resources = await this.prisma.digitalResource.findMany({
      where,
      orderBy: { title: 'asc' },
    });
    return { success: true, data: resources };
  }

  async getLibraryStatus(userId: string) {
    const student = await this.getStudentByUserId(userId);
    const [borrowedCount, overdueCount, fines, activeReservations] =
      await Promise.all([
        this.prisma.borrowRecord.count({
          where: {
            studentId: student.id,
            status: 'BORROWED',
          },
        }),
        this.prisma.borrowRecord.count({
          where: {
            studentId: student.id,
            status: 'OVERDUE',
          },
        }),
        this.prisma.borrowRecord.aggregate({
          where: {
            studentId: student.id,
            fine: { gt: 0 },
          },
          _sum: { fine: true },
        }),
        this.prisma.reservation.count({
          where: {
            studentId: student.id,
            status: 'ACTIVE',
          },
        }),
      ]);

    return {
      success: true,
      data: {
        borrowedCount,
        overdueCount,
        totalFines: fines._sum.fine ?? 0,
        activeReservations,
      },
    };
  }
}

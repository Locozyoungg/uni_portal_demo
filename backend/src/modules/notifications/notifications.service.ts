import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      success: true,
      data: notifications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true, message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true, message: 'All notifications marked as read' };
  }

  async getAnnouncements(
    page = 1,
    limit = 20,
    role?: string,
    facultyId?: string,
    departmentId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      expiresAt: { gte: new Date() },
    };

    if (role) {
      where.targetRole = role;
    }
    if (facultyId) {
      where.OR = [
        { targetFaculty: facultyId },
        { targetFaculty: null },
      ];
    }
    if (departmentId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { targetDepartment: departmentId },
            { targetDepartment: null },
          ],
        },
      ];
    }

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      success: true,
      data: announcements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPreferences(userId: string) {
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    return {
      success: true,
      data: prefs || { emailEnabled: true, smsEnabled: false, pushEnabled: true },
    };
  }

  async updatePreferences(userId: string, data: { emailEnabled?: boolean; smsEnabled?: boolean; pushEnabled?: boolean }) {
    const prefs = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        emailEnabled: data.emailEnabled ?? true,
        smsEnabled: data.smsEnabled ?? false,
        pushEnabled: data.pushEnabled ?? true,
      },
      update: data,
    });

    return { success: true, data: prefs };
  }
}

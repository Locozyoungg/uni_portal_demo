import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async getInbox(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { receiverId: userId },
        include: {
          sender: {
            select: { id: true, username: true, role: true },
          },
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { receiverId: userId } }),
    ]);

    return {
      success: true,
      data: messages,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSent(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { senderId: userId },
        include: {
          receiver: {
            select: { id: true, username: true, role: true },
          },
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { senderId: userId } }),
    ]);

    return {
      success: true,
      data: messages,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async sendMessage(
    senderId: string,
    receiverId: string,
    subject: string,
    content: string,
  ) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new BadRequestException('Receiver not found');
    }

    if (!receiver.isActive) {
      throw new BadRequestException('Cannot send message to an inactive user');
    }

    const message = await this.prisma.message.create({
      data: { senderId, receiverId, subject, content },
    });

    // Create notification for receiver
    await this.prisma.notification.create({
      data: {
        userId: receiverId,
        title: 'New Message',
        message: `You have received a new message: "${subject}"`,
        type: 'MESSAGE',
      },
    });

    return { success: true, data: message };
  }

  async getMessage(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: { id: true, username: true, role: true },
        },
        receiver: {
          select: { id: true, username: true, role: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Mark as read if the current user is the receiver
    if (!message.isRead) {
      await this.prisma.message.update({
        where: { id: messageId },
        data: { isRead: true },
      });
    }

    return { success: true, data: { ...message, isRead: true } };
  }

  async getSupportTickets(studentId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: tickets };
  }

  async createSupportTicket(
    studentId: string,
    subject: string,
    description: string,
    priority = 'MEDIUM',
  ) {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!validPriorities.includes(priority.toUpperCase())) {
      throw new BadRequestException(
        `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
      );
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        studentId,
        subject,
        description,
        priority: priority.toUpperCase(),
        status: 'OPEN',
      },
    });

    // Notify admin users
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] } },
      select: { id: true },
    });

    if (admins.length > 0) {
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: 'New Support Ticket',
          message: `A new support ticket has been created: "${subject}"`,
          type: 'SUPPORT_TICKET',
        })),
      });
    }

    return { success: true, data: ticket };
  }

  async getAdminUsers() {
    const users = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] }, isActive: true },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
      orderBy: { username: 'asc' },
    });

    return { success: true, data: users };
  }
}

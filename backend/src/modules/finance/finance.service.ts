import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getStudentByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) {
      throw new NotFoundException('Student profile not found for this user');
    }
    return student;
  }

  async getFeeStatement(studentId: string) {
    const statement = await this.prisma.feeStatement.findFirst({
      where: { studentId },
      include: { semester: true },
      orderBy: { generatedAt: 'desc' },
    });

    if (!statement) {
      throw new NotFoundException('No fee statement found');
    }

    return { success: true, data: statement };
  }

  async getBalance(studentId: string) {
    const statement = await this.prisma.feeStatement.findFirst({
      where: { studentId },
      orderBy: { generatedAt: 'desc' },
    });

    return {
      success: true,
      data: {
        balance: statement?.balance ?? 0,
        totalCharges: statement?.totalCharges ?? 0,
        totalPayments: statement?.totalPayments ?? 0,
        semesterId: statement?.semesterId ?? null,
      },
    };
  }

  async getPayments(studentId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { studentId },
        skip,
        take: limit,
        include: { invoice: true },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.payment.count({ where: { studentId } }),
    ]);

    return {
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getInvoices(studentId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { studentId },
      include: { semester: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: invoices };
  }

  async getReceipt(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: { include: { semester: true } },
        student: {
          include: {
            user: { select: { username: true } },
            faculty: true,
            programme: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return { success: true, data: payment };
  }

  async getScholarships(studentId: string) {
    const scholarships = await this.prisma.scholarship.findMany({
      where: { studentId },
      orderBy: { startDate: 'desc' },
    });

    return { success: true, data: scholarships };
  }

  async simulatePayment(
    studentId: string,
    invoiceId: string,
    amount: number,
    method: string = 'MPESA',
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.studentId !== studentId) {
      throw new BadRequestException('Invoice does not belong to this student');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already fully paid');
    }

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create the payment record
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        studentId,
        amount,
        method,
        reference,
        status: 'COMPLETED',
        paidAt: new Date(),
      },
      include: { invoice: true },
    });

    // Calculate total paid on this invoice
    const totalPaidAgg = await this.prisma.payment.aggregate({
      where: { invoiceId, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const totalPaid = totalPaidAgg._sum.amount ?? 0;

    // Update invoice status
    const newStatus =
      totalPaid >= invoice.amount
        ? 'PAID'
        : totalPaid > 0
          ? 'PARTIAL'
          : 'PENDING';

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    });

    return {
      success: true,
      data: payment,
      message: `Payment of ${amount} recorded. Invoice status: ${newStatus}`,
    };
  }
}

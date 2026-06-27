import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('statement')
  @ApiOperation({ summary: 'Get fee statement' })
  async getFeeStatement(@CurrentUser() user: any) {
    const student = await this.financeService.getStudentByUserId(user.sub);
    return this.financeService.getFeeStatement(student.id);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get current balance' })
  async getBalance(@CurrentUser() user: any) {
    const student = await this.financeService.getStudentByUserId(user.sub);
    return this.financeService.getBalance(student.id);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get payment history' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getPayments(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const student = await this.financeService.getStudentByUserId(user.sub);
    return this.financeService.getPayments(
      student.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  async getInvoices(@CurrentUser() user: any) {
    const student = await this.financeService.getStudentByUserId(user.sub);
    return this.financeService.getInvoices(student.id);
  }

  @Get('receipts/:id')
  @ApiOperation({ summary: 'Get payment receipt' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  async getReceipt(@Param('id') id: string) {
    return this.financeService.getReceipt(id);
  }

  @Get('scholarships')
  @ApiOperation({ summary: 'Get scholarships' })
  async getScholarships(@CurrentUser() user: any) {
    const student = await this.financeService.getStudentByUserId(user.sub);
    return this.financeService.getScholarships(student.id);
  }

  @Post('simulate-payment')
  @ApiOperation({ summary: 'Simulate a payment' })
  async simulatePayment(
    @CurrentUser() user: any,
    @Body() body: { invoiceId: string; amount: number; method?: string },
  ) {
    const student = await this.financeService.getStudentByUserId(user.sub);
    return this.financeService.simulatePayment(
      student.id,
      body.invoiceId,
      body.amount,
      body.method,
    );
  }
}

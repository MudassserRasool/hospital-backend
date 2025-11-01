import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  @Roles('patient')
  @ApiOperation({ summary: 'Process payment for appointment' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  async processPayment(
    @Body('appointmentId') appointmentId: string,
    @Body('patientId') patientId: string,
    @Body('amount') amount: number,
    @Body('walletAmountToUse') walletAmountToUse: number = 0,
    @CurrentUser() user: any,
  ) {
    // Ensure patient can only pay for their own appointments
    if (user.role === 'patient' && patientId !== user.patientId) {
      throw new Error('Unauthorized');
    }

    return this.paymentsService.processPayment(
      appointmentId,
      patientId,
      amount,
      walletAmountToUse,
    );
  }

  @Post('verify')
  @Public()
  @ApiOperation({ summary: 'Verify payment (EasyPaisa callback)' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  async verifyPayment(
    @Body('transactionId') transactionId: string,
    @Body() easyPaisaData: any,
  ) {
    return this.paymentsService.verifyPayment(transactionId, easyPaisaData);
  }

  @Post(':id/refund')
  @Roles('receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Process refund (90% + 10% wallet credit)' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  async processRefund(
    @Param('id') paymentId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.processRefund(paymentId, reason, user.id);
  }

  @Get(':id')
  @Roles('patient', 'receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  async getPayment(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }

  @Get('transaction/:transactionId')
  @Roles('patient', 'receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Get payment by transaction ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  async getPaymentByTransactionId(@Param('transactionId') transactionId: string) {
    return this.paymentsService.getPaymentByTransactionId(transactionId);
  }

  @Get('patient/:patientId')
  @Roles('patient', 'receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Get patient payment history' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getPatientPaymentHistory(
    @Param('patientId') patientId: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.getPatientPaymentHistory(patientId, {
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
      status,
    });
  }
}

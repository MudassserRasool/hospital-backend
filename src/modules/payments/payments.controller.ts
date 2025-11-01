import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, VerifyPaymentDto, RefundPaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  @Roles('patient', 'receptionist')
  @ApiOperation({ summary: 'Process payment for appointment' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Payment processing failed' })
  processPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.processPayment(createPaymentDto);
  }

  @Post('verify')
  @Roles('patient', 'receptionist', 'owner')
  @ApiOperation({ summary: 'Verify payment status' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(verifyPaymentDto);
  }

  @Post('refund')
  @Roles('receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Process refund (90% EasyPaisa, 10% wallet)' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  refundPayment(@Body() refundPaymentDto: RefundPaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.refundPayment(refundPaymentDto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: 'Get payment by transaction ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  findByTransaction(@Param('transactionId') transactionId: string) {
    return this.paymentsService.findByTransactionId(transactionId);
  }

  @Get('appointment/:appointmentId')
  @Roles('patient', 'receptionist', 'doctor', 'owner')
  @ApiOperation({ summary: 'Get payments for appointment' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  findByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.paymentsService.findByAppointment(appointmentId);
  }

  @Get('patient/:patientId')
  @Roles('patient', 'receptionist', 'owner')
  @ApiOperation({ summary: 'Get patient payment history' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.paymentsService.findByPatient(patientId);
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './entities/payment.entity';
import { CreatePaymentDto, VerifyPaymentDto, RefundPaymentDto } from './dto/create-payment.dto';
import { PaymentService as EasyPaisaService } from '../../integrations/payment/payment.service';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private easyPaisaService: EasyPaisaService,
    private walletsService: WalletsService,
  ) {}

  async processPayment(createPaymentDto: CreatePaymentDto) {
    // Generate unique transaction ID
    const transactionId = await this.generateTransactionId();

    let easyPaisaResponse: any = null;
    let walletDeduction: any = null;

    // Handle wallet payment
    if (createPaymentDto.method === 'wallet' || createPaymentDto.method === 'mixed') {
      if (createPaymentDto.walletAmountUsed && createPaymentDto.walletAmountUsed > 0) {
        try {
          walletDeduction = await this.walletsService.debit(
            createPaymentDto.patientId,
            createPaymentDto.walletAmountUsed,
            `Payment for appointment ${createPaymentDto.appointmentId}`,
            createPaymentDto.appointmentId,
          );
        } catch (error) {
          throw new BadRequestException('Failed to deduct from wallet: ' + error.message);
        }
      }
    }

    // Handle EasyPaisa payment
    if (createPaymentDto.method === 'easypaisa' || createPaymentDto.method === 'mixed') {
      const easyPaisaAmount = createPaymentDto.easyPaisaAmountPaid || createPaymentDto.amount;
      
      try {
        easyPaisaResponse = await this.easyPaisaService.initiatePayment(
          easyPaisaAmount,
          transactionId,
          `Appointment Payment - ${createPaymentDto.appointmentId}`,
        );
      } catch (error) {
        // Rollback wallet deduction if EasyPaisa fails
        if (walletDeduction && createPaymentDto.walletAmountUsed) {
          await this.walletsService.addCredit(
            createPaymentDto.patientId,
            createPaymentDto.walletAmountUsed,
            'Refund - Payment failed',
            createPaymentDto.appointmentId,
          );
        }
        throw new BadRequestException('Failed to process EasyPaisa payment');
      }
    }

    // Create payment record
    const payment = await this.paymentModel.create({
      ...createPaymentDto,
      transactionId,
      status: createPaymentDto.method === 'wallet' ? 'completed' : 'pending',
      easyPaisaResponse,
      easyPaisaTransactionId: (easyPaisaResponse as any)?.transactionId,
      completedAt: createPaymentDto.method === 'wallet' ? new Date() : null,
    });

    return payment.populate([
      { path: 'appointmentId', select: 'appointmentId date timeSlot' },
      { path: 'patientId', populate: { path: 'userId', select: 'firstName lastName email' } },
    ]);
  }

  async verifyPayment(verifyPaymentDto: VerifyPaymentDto) {
    const payment = await this.paymentModel.findOne({ transactionId: verifyPaymentDto.transactionId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'completed') {
      return payment;
    }

    // Verify with EasyPaisa
    if (verifyPaymentDto.easyPaisaTransactionId) {
      const verification = await this.easyPaisaService.verifyPayment(verifyPaymentDto.easyPaisaTransactionId);

      if (verification.success && verification.status === 'completed') {
        payment.status = 'completed';
        payment.completedAt = new Date();
        await payment.save();
      } else {
        payment.status = 'failed';
        payment.failureReason = 'Payment verification failed';
        await payment.save();
      }
    }

    return payment.populate([
      { path: 'appointmentId' },
      { path: 'patientId', populate: { path: 'userId' } },
    ]);
  }

  async refundPayment(refundPaymentDto: RefundPaymentDto, refundedBy: string) {
    const payment = await this.paymentModel.findById(refundPaymentDto.paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    const refundAmount = refundPaymentDto.amount || payment.amount;

    // Calculate refund split: 90% to EasyPaisa, 10% to wallet
    const walletRefund = Math.round(refundAmount * 0.1 * 100) / 100;
    const easyPaisaRefund = Math.round(refundAmount * 0.9 * 100) / 100;

    // Process EasyPaisa refund
    if (payment.easyPaisaAmountPaid && payment.easyPaisaAmountPaid > 0) {
      try {
        await this.easyPaisaService.processRefund(
          payment.easyPaisaTransactionId || payment.transactionId,
          easyPaisaRefund,
          refundPaymentDto.reason,
        );
      } catch (error) {
        throw new BadRequestException('Failed to process EasyPaisa refund');
      }
    }

    // Add credit to wallet
    if (walletRefund > 0) {
      await this.walletsService.addCredit(
        payment.patientId.toString(),
        walletRefund,
        `Refund credit for appointment cancellation - ${refundPaymentDto.reason}`,
        payment.appointmentId.toString(),
        (payment._id as any).toString(),
      );
    }

    // Update payment record
    payment.status = refundAmount === payment.amount ? 'refunded' : 'partially_refunded';
    payment.refundAmount = refundAmount;
    payment.refundReason = refundPaymentDto.reason;
    payment.refundedAt = new Date();
    payment.refundedBy = refundedBy as any;
    payment.walletRefundAmount = walletRefund;
    payment.easyPaisaRefundAmount = easyPaisaRefund;

    await payment.save();

    return payment.populate([
      { path: 'appointmentId' },
      { path: 'patientId', populate: { path: 'userId' } },
      { path: 'refundedBy', select: 'firstName lastName role' },
    ]);
  }

  async findOne(id: string) {
    const payment = await this.paymentModel
      .findById(id)
      .populate([
        { path: 'appointmentId' },
        { path: 'patientId', populate: { path: 'userId' } },
        { path: 'refundedBy', select: 'firstName lastName role' },
      ])
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByTransactionId(transactionId: string) {
    const payment = await this.paymentModel
      .findOne({ transactionId })
      .populate([
        { path: 'appointmentId' },
        { path: 'patientId', populate: { path: 'userId' } },
      ])
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByAppointment(appointmentId: string) {
    const payments = await this.paymentModel
      .find({ appointmentId })
      .populate([
        { path: 'appointmentId' },
        { path: 'patientId', populate: { path: 'userId' } },
      ])
      .exec();

    return payments;
  }

  async findByPatient(patientId: string) {
    const payments = await this.paymentModel
      .find({ patientId })
      .populate('appointmentId')
      .sort({ createdAt: -1 })
      .exec();

    return payments;
  }

  private async generateTransactionId(): Promise<string> {
    const prefix = 'TXN';
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
  }
}

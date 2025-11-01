import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './entities/payment.entity';
import { WalletsService } from '../wallets/wallets.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private walletsService: WalletsService,
  ) {}

  /**
   * Process payment for appointment
   * Supports: EasyPaisa only, Wallet only, or Mixed payment
   */
  async processPayment(
    appointmentId: string,
    patientId: string,
    totalAmount: number,
    walletAmountToUse: number = 0,
  ) {
    // Validate amount
    if (totalAmount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    // Generate unique transaction ID
    const transactionId = `TXN-${uuidv4()}`;

    // Check wallet balance if using wallet
    if (walletAmountToUse > 0) {
      const hasBalance = await this.walletsService.hasSufficientBalance(patientId, walletAmountToUse);
      if (!hasBalance) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // Validate wallet amount doesn't exceed total
      if (walletAmountToUse > totalAmount) {
        throw new BadRequestException('Wallet amount cannot exceed total amount');
      }
    }

    const easyPaisaAmount = totalAmount - walletAmountToUse;
    let paymentMethod: 'easypaisa' | 'wallet' | 'mixed';

    if (walletAmountToUse === 0) {
      paymentMethod = 'easypaisa';
    } else if (walletAmountToUse === totalAmount) {
      paymentMethod = 'wallet';
    } else {
      paymentMethod = 'mixed';
    }

    // Create payment record
    const payment = await this.paymentModel.create({
      appointmentId,
      patientId,
      amount: totalAmount,
      method: paymentMethod,
      status: 'pending',
      transactionId,
      walletAmountUsed: walletAmountToUse,
      easyPaisaAmountPaid: easyPaisaAmount,
    });

    // If using wallet, debit immediately
    if (walletAmountToUse > 0) {
      await this.walletsService.debitWallet(
        patientId,
        walletAmountToUse,
        `Payment for appointment ${appointmentId}`,
        appointmentId,
        payment._id.toString(),
      );
    }

    // Process EasyPaisa payment if needed
    if (easyPaisaAmount > 0) {
      try {
        const easyPaisaResponse = await this.processEasyPaisaPayment(
          transactionId,
          easyPaisaAmount,
          patientId,
          appointmentId,
        );

        payment.easyPaisaTransactionId = easyPaisaResponse.transactionId;
        payment.easyPaisaResponse = easyPaisaResponse;
        payment.status = 'processing';
        await payment.save();

        return {
          payment,
          easyPaisaCheckoutUrl: easyPaisaResponse.checkoutUrl,
          requiresEasyPaisaAction: true,
        };
      } catch (error) {
        // If EasyPaisa fails, refund wallet if it was debited
        if (walletAmountToUse > 0) {
          await this.walletsService.creditWallet(
            patientId,
            walletAmountToUse,
            `Refund for failed payment ${transactionId}`,
            appointmentId,
            payment._id.toString(),
          );
        }

        payment.status = 'failed';
        payment.failureReason = error.message;
        await payment.save();

        throw new BadRequestException('Payment processing failed: ' + error.message);
      }
    } else {
      // Wallet-only payment - mark as completed immediately
      payment.status = 'completed';
      payment.completedAt = new Date();
      await payment.save();

      return {
        payment,
        requiresEasyPaisaAction: false,
      };
    }
  }

  /**
   * Verify payment status (callback from EasyPaisa)
   */
  async verifyPayment(transactionId: string, easyPaisaData: any) {
    const payment = await this.paymentModel.findOne({ transactionId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Mock verification - in production, verify with EasyPaisa API
    if (easyPaisaData.status === 'success') {
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.easyPaisaResponse = easyPaisaData;
    } else {
      payment.status = 'failed';
      payment.failureReason = easyPaisaData.message || 'Payment failed';

      // Refund wallet if it was used
      if (payment.walletAmountUsed > 0) {
        await this.walletsService.creditWallet(
          payment.patientId.toString(),
          payment.walletAmountUsed,
          `Refund for failed payment ${transactionId}`,
          payment.appointmentId.toString(),
          payment._id.toString(),
        );
      }
    }

    await payment.save();
    return payment;
  }

  /**
   * Process refund (90% EasyPaisa + 10% Wallet credit)
   */
  async processRefund(
    paymentId: string,
    reason: string,
    refundedBy: string,
  ) {
    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    if (payment.status === 'refunded' || payment.status === 'partially_refunded') {
      throw new BadRequestException('Payment already refunded');
    }

    const totalRefundAmount = payment.amount;
    const walletRefund = Math.round(totalRefundAmount * 0.1); // 10% to wallet
    const easyPaisaRefund = totalRefundAmount - walletRefund; // 90% to EasyPaisa

    // Credit 10% to wallet
    await this.walletsService.creditWallet(
      payment.patientId.toString(),
      walletRefund,
      `Wallet credit (10%) from cancelled appointment`,
      payment.appointmentId.toString(),
      payment._id.toString(),
    );

    // Process EasyPaisa refund for 90%
    if (easyPaisaRefund > 0 && payment.easyPaisaAmountPaid > 0) {
      try {
        await this.processEasyPaisaRefund(
          payment.easyPaisaTransactionId,
          easyPaisaRefund,
        );
      } catch (error) {
        // Log error but don't fail - manual intervention may be needed
        console.error('EasyPaisa refund failed:', error);
      }
    }

    payment.status = 'refunded';
    payment.refundAmount = totalRefundAmount;
    payment.walletRefundAmount = walletRefund;
    payment.easyPaisaRefundAmount = easyPaisaRefund;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    payment.refundedBy = refundedBy as any;

    await payment.save();

    return payment;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string) {
    const payment = await this.paymentModel
      .findById(paymentId)
      .populate('appointmentId')
      .populate('patientId')
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Get payment by transaction ID
   */
  async getPaymentByTransactionId(transactionId: string) {
    const payment = await this.paymentModel
      .findOne({ transactionId })
      .populate('appointmentId')
      .populate('patientId')
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Get payment history for a patient
   */
  async getPatientPaymentHistory(
    patientId: string,
    options?: {
      limit?: number;
      skip?: number;
      status?: string;
    },
  ) {
    const query: any = { patientId };

    if (options?.status) {
      query.status = options.status;
    }

    const payments = await this.paymentModel
      .find(query)
      .populate('appointmentId')
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0)
      .exec();

    const total = await this.paymentModel.countDocuments(query);

    return {
      payments,
      total,
    };
  }

  /**
   * Mock EasyPaisa payment processing
   * In production, integrate with actual EasyPaisa API
   */
  private async processEasyPaisaPayment(
    transactionId: string,
    amount: number,
    patientId: string,
    appointmentId: string,
  ): Promise<any> {
    // Mock implementation - replace with actual EasyPaisa integration
    return {
      success: true,
      transactionId: `EP-${uuidv4()}`,
      checkoutUrl: `https://easypaisa.com/checkout?txn=${transactionId}&amount=${amount}`,
      status: 'pending',
      message: 'Payment initiated. Please complete payment on EasyPaisa.',
    };
  }

  /**
   * Mock EasyPaisa refund processing
   * In production, integrate with actual EasyPaisa API
   */
  private async processEasyPaisaRefund(
    easyPaisaTransactionId: string,
    amount: number,
  ): Promise<any> {
    // Mock implementation - replace with actual EasyPaisa refund API
    return {
      success: true,
      refundTransactionId: `REF-${uuidv4()}`,
      amount,
      status: 'processing',
      message: 'Refund initiated. Will be processed within 3-5 business days.',
    };
  }
}


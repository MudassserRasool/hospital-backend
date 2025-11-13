import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from './entities/wallet.entity';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  /**
   * Create wallet for a patient (auto-created during patient registration)
   */
  async createWallet(patientId: string) {
    const existing = await this.walletModel.findOne({ patientId });
    if (existing) {
      return existing;
    }

    const wallet = await this.walletModel.create({
      patientId,
      balance: 0,
      transactions: [],
    });

    return wallet;
  }

  /**
   * Get wallet by patient ID
   */
  async getWalletByPatientId(patientId: string) {
    const wallet = await this.walletModel
      .findOne({ patientId })
      .populate('patientId', 'userId')
      .exec();

    if (!wallet) {
      // Auto-create wallet if not exists
      return this.createWallet(patientId);
    }

    return wallet;
  }

  /**
   * Get wallet by wallet ID
   */
  async getWalletById(walletId: string) {
    const wallet = await this.walletModel
      .findById(walletId)
      .populate('patientId', 'userId')
      .exec();

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  /**
   * Credit wallet (add money)
   * Used for: refunds, promotional credits, rewards
   */
  async creditWallet(
    patientId: string,
    amount: number,
    description: string,
    relatedAppointmentId?: string,
    relatedPaymentId?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }

    const wallet = await this.getWalletByPatientId(patientId);
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    wallet.balance = balanceAfter;
    wallet.transactions.push({
      type: 'credit',
      amount,
      description,
      relatedAppointmentId: relatedAppointmentId ? new Types.ObjectId(relatedAppointmentId) : undefined,
      relatedPaymentId: relatedPaymentId ? new Types.ObjectId(relatedPaymentId) : undefined,
      balanceBefore,
      balanceAfter,
      date: new Date(),
    } as any);

    await wallet.save();

    return wallet;
  }

  /**
   * Debit wallet (deduct money)
   * Used for: payments using wallet credit
   */
  async debitWallet(
    patientId: string,
    amount: number,
    description: string,
    relatedAppointmentId?: string,
    relatedPaymentId?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Debit amount must be positive');
    }

    const wallet = await this.getWalletByPatientId(patientId);

    if (wallet.balance < amount) {
      throw new BadRequestException(
        `Insufficient wallet balance. Available: ${wallet.balance}, Required: ${amount}`,
      );
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    wallet.balance = balanceAfter;
    wallet.transactions.push({
      type: 'debit',
      amount,
      description,
      relatedAppointmentId: relatedAppointmentId ? new Types.ObjectId(relatedAppointmentId) : undefined,
      relatedPaymentId: relatedPaymentId ? new Types.ObjectId(relatedPaymentId) : undefined,
      balanceBefore,
      balanceAfter,
      date: new Date(),
    } as any);

    await wallet.save();

    return wallet;
  }

  /**
   * Get wallet transactions with pagination and filters
   */
  async getTransactions(
    patientId: string,
    options?: {
      limit?: number;
      skip?: number;
      type?: 'credit' | 'debit';
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const wallet = await this.getWalletByPatientId(patientId);

    let transactions = wallet.transactions || [];

    // Filter by type
    if (options?.type) {
      transactions = transactions.filter((t) => t.type === options.type);
    }

    // Filter by date range
    if (options?.startDate) {
      transactions = transactions.filter((t) => t.date >= options.startDate!);
    }
    if (options?.endDate) {
      transactions = transactions.filter((t) => t.date <= options.endDate!);
    }

    // Sort by date descending (newest first)
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Pagination
    const skip = options?.skip || 0;
    const limit = options?.limit || 50;
    const paginatedTransactions = transactions.slice(skip, skip + limit);

    return {
      transactions: paginatedTransactions,
      total: transactions.length,
      balance: wallet.balance,
    };
  }

  /**
   * Get wallet balance
   */
  async getBalance(patientId: string): Promise<number> {
    const wallet = await this.getWalletByPatientId(patientId);
    return wallet.balance;
  }

  /**
   * Check if patient has sufficient balance
   */
  async hasSufficientBalance(patientId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(patientId);
    return balance >= amount;
  }
}

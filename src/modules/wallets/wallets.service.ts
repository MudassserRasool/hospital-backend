import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from './entities/wallet.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async create(createWalletDto: CreateWalletDto) {
    const existingWallet = await this.walletModel.findOne({ patientId: createWalletDto.patientId });
    if (existingWallet) {
      return existingWallet;
    }

    const wallet = await this.walletModel.create({
      ...createWalletDto,
      balance: 0,
      transactions: [],
    });

    return wallet;
  }

  async findByPatientId(patientId: string) {
    let wallet = await this.walletModel.findOne({ patientId }).populate('patientId').exec();
    
    if (!wallet) {
      // Auto-create wallet if doesn't exist
      wallet = await this.walletModel.create({
        patientId,
        balance: 0,
        transactions: [],
      });
    }

    return wallet;
  }

  async addCredit(patientId: string, amount: number, description: string, relatedAppointmentId?: string, relatedPaymentId?: string) {
    const wallet = await this.findByPatientId(patientId);

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    wallet.balance = balanceAfter;
    wallet.transactions.push({
      type: 'credit',
      amount,
      description,
      relatedAppointmentId: relatedAppointmentId as any,
      relatedPaymentId: relatedPaymentId as any,
      balanceBefore,
      balanceAfter,
      date: new Date(),
    });

    await wallet.save();

    return wallet;
  }

  async debit(patientId: string, amount: number, description: string, relatedAppointmentId?: string) {
    const wallet = await this.findByPatientId(patientId);

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    wallet.balance = balanceAfter;
    wallet.transactions.push({
      type: 'debit',
      amount,
      description,
      relatedAppointmentId: relatedAppointmentId as any,
      balanceBefore,
      balanceAfter,
      date: new Date(),
    });

    await wallet.save();

    return wallet;
  }

  async getTransactions(patientId: string, limit: number = 50) {
    const wallet = await this.findByPatientId(patientId);
    
    const transactions = wallet.transactions
      .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);

    return {
      patientId,
      balance: wallet.balance,
      transactions,
    };
  }

  async getBalance(patientId: string) {
    const wallet = await this.findByPatientId(patientId);
    return {
      patientId,
      balance: wallet.balance,
    };
  }
}

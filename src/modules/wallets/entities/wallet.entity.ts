import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, unique: true })
  patientId: Types.ObjectId;

  @Prop({ default: 0 })
  balance: number;

  @Prop({
    type: [
      {
        type: { type: String, enum: ['credit', 'debit'] },
        amount: Number,
        description: String,
        relatedAppointmentId: { type: Types.ObjectId, ref: 'Appointment' },
        relatedPaymentId: { type: Types.ObjectId, ref: 'Payment' },
        balanceBefore: Number,
        balanceAfter: Number,
        date: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  transactions: Array<{
    type: string;
    amount: number;
    description: string;
    relatedAppointmentId?: Types.ObjectId;
    relatedPaymentId?: Types.ObjectId;
    balanceBefore: number;
    balanceAfter: number;
    date: Date;
  }>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Indexes
WalletSchema.index({ patientId: 1 });

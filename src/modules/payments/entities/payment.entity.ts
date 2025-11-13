import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: true })
  appointmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: ['easypaisa', 'wallet', 'mixed'], required: true })
  method: string;

  @Prop({ enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'], default: 'pending' })
  status: string;

  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop()
  easyPaisaTransactionId?: string;

  @Prop({ type: Object })
  easyPaisaResponse?: any;

  @Prop({ default: 0 })
  walletAmountUsed?: number;

  @Prop({ default: 0 })
  easyPaisaAmountPaid?: number;

  @Prop()
  refundAmount?: number;

  @Prop()
  refundReason?: string;

  @Prop()
  refundedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  refundedBy?: Types.ObjectId;

  @Prop()
  walletRefundAmount?: number; // 10% to wallet

  @Prop()
  easyPaisaRefundAmount?: number; // 90% to EasyPaisa

  @Prop()
  completedAt?: Date;

  @Prop()
  failureReason?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ appointmentId: 1 });
PaymentSchema.index({ patientId: 1 });
PaymentSchema.index({ status: 1 });

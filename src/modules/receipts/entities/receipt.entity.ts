import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReceiptDocument = Receipt & Document;

@Schema({ timestamps: true })
export class Receipt {
  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: true })
  appointmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: true })
  hospitalId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, unique: true })
  receiptNumber: string;

  @Prop()
  generatedAt?: Date;

  @Prop({ type: Object })
  receiptData?: any;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReceiptSchema = SchemaFactory.createForClass(Receipt);

// Indexes
ReceiptSchema.index({ receiptNumber: 1 });
ReceiptSchema.index({ appointmentId: 1 });
ReceiptSchema.index({ patientId: 1 });
ReceiptSchema.index({ hospitalId: 1 });

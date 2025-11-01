import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeaveDocument = Leave & Document;

@Schema({ timestamps: true })
export class Leave {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  staffId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: true })
  hospitalId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  reason: string;

  @Prop({ enum: ['sick', 'casual', 'annual', 'emergency', 'other'], required: true })
  leaveType: string;

  @Prop({ enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  reviewerNotes?: string;

  @Prop()
  rejectionReason?: string;

  @Prop()
  totalDays: number;

  @Prop({ type: [String], default: [] })
  attachments?: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const LeaveSchema = SchemaFactory.createForClass(Leave);

// Indexes
LeaveSchema.index({ staffId: 1 });
LeaveSchema.index({ hospitalId: 1 });
LeaveSchema.index({ status: 1 });
LeaveSchema.index({ startDate: 1, endDate: 1 });


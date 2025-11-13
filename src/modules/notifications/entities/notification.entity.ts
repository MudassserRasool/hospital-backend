import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ 
    type: String,
    enum: ['appointment_confirmed', 'appointment_reminder', 'appointment_cancelled', 'payment_received', 'refund_processed', 'leave_approved', 'leave_rejected', 'general'],
    required: true,
  })
  type: string;

  @Prop({ type: Object })
  data?: any;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ default: false })
  isSent: boolean;

  @Prop()
  sentAt?: Date;

  @Prop()
  pushToken?: string;

  @Prop()
  expoTicketId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  relatedAppointmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  relatedPaymentId?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

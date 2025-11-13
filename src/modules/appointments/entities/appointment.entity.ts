import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ required: true, unique: true })
  appointmentId: string;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: true })
  hospitalId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId?: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({
    type: {
      start: Date,
      end: Date,
    },
    required: true,
  })
  timeSlot: {
    start: Date;
    end: Date;
  };

  @Prop({
    type: String,
    enum: ['pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'],
    default: 'pending',
  })
  status: string;

  @Prop({
    type: String,
    enum: ['pending', 'paid', 'refunded', 'partially_refunded'],
    default: 'pending',
  })
  paymentStatus: string;

  @Prop({ required: true })
  paymentAmount: number;

  @Prop({ default: 0 })
  walletCreditUsed?: number;

  @Prop()
  transactionId?: string;

  @Prop({
    type: {
      bloodPressure: {
        systolic: Number,
        diastolic: Number,
      },
      temperature: Number,
      heartRate: Number,
      weight: Number,
      height: Number,
      oxygenSaturation: Number,
      notes: String,
      recordedBy: { type: Types.ObjectId, ref: 'User' },
      recordedAt: Date,
    },
  })
  vitals?: {
    bloodPressure: {
      systolic: number;
      diastolic: number;
    };
    temperature: number;
    heartRate: number;
    weight: number;
    height: number;
    oxygenSaturation: number;
    notes?: string;
    recordedBy: Types.ObjectId;
    recordedAt: Date;
  };

  @Prop()
  checkupNotes?: string;

  @Prop()
  diagnosis?: string;

  @Prop({
    type: [
      {
        medicineName: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
      },
    ],
  })
  prescriptions?: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;

  @Prop()
  cancellationReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  checkedInAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  appointmentType?: string; // 'consultation', 'follow_up', 'emergency', etc.

  @Prop()
  chiefComplaint?: string;

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  previousAppointmentId?: Types.ObjectId; // For follow-ups

  @Prop()
  estimatedDuration?: number; // in minutes

  @Prop({ default: false })
  isUrgent?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// Indexes
AppointmentSchema.index({ appointmentId: 1 });
AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ doctorId: 1 });
AppointmentSchema.index({ hospitalId: 1 });
AppointmentSchema.index({ date: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ 'timeSlot.start': 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema({ timestamps: true })
export class Patient {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop()
  dateOfBirth?: Date;

  @Prop({ enum: ['male', 'female', 'other'] })
  gender?: string;

  @Prop({ enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] })
  bloodType?: string;

  @Prop({ type: [String], default: [] })
  allergies?: string[];

  @Prop({ type: [String], default: [] })
  chronicConditions?: string[];

  @Prop({
    type: {
      name: String,
      phone: String,
      relation: String,
    },
  })
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop()
  blockReason?: string;

  @Prop({
    type: [
      {
        action: String, // 'blocked' or 'unblocked'
        reason: String,
        by: { type: Types.ObjectId, ref: 'User' },
        date: Date,
      },
    ],
    default: [],
  })
  blockHistory?: Array<{
    action: string;
    reason?: string;
    by: Types.ObjectId;
    date: Date;
  }>;

  @Prop()
  medicalRecordNumber?: string;

  @Prop()
  insuranceProvider?: string;

  @Prop()
  insurancePolicyNumber?: string;

  @Prop({ default: 0 })
  totalAppointments?: number;

  @Prop({ default: 0 })
  completedAppointments?: number;

  @Prop({ default: 0 })
  cancelledAppointments?: number;

  @Prop({ default: 0 })
  noShowAppointments?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);

// Indexes
PatientSchema.index({ userId: 1 });
PatientSchema.index({ medicalRecordNumber: 1 });
PatientSchema.index({ isBlocked: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GENDER_TYPES_ARRAY } from 'src/common/constants';
import { BLOOD_TYPES } from 'src/common/constants/paitent';
import ROLES from 'src/common/constants/roles.constant';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ROLES,
  })
  role: string;

  // Common profile fields
  @Prop()
  dateOfBirth?: Date;

  @Prop({ enum: GENDER_TYPES_ARRAY })
  gender?: string;

  // Doctor/Staff-specific fields
  @Prop()
  specialization?: string;

  @Prop()
  licenseNumber?: string;

  @Prop()
  experience?: string;

  @Prop({ type: [Date], default: [] })
  timing?: Date[];

  // Patient-specific fields
  @Prop({ enum: BLOOD_TYPES })
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

  @Prop()
  medicalRecordNumber?: string;

  @Prop()
  insuranceProvider?: string;

  @Prop()
  insurancePolicyNumber?: string;

  // Appointment statistics (for patients)
  @Prop({ default: 0 })
  totalAppointments?: number;

  @Prop({ default: 0 })
  completedAppointments?: number;

  @Prop({ default: 0 })
  cancelledAppointments?: number;

  @Prop({ default: 0 })
  noShowAppointments?: number;

  // Note: Blocking is managed in users collection, not here

  // Hospital reference (for patients)
  @Prop({ type: Types.ObjectId, ref: 'Hospital' })
  hospitalId?: Types.ObjectId;

  // Phone number (for patients - can be different from user phone)
  @Prop()
  phone?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

// Indexes
ProfileSchema.index({ userId: 1 }, { unique: true });
ProfileSchema.index({ role: 1 });
ProfileSchema.index({ medicalRecordNumber: 1 });
ProfileSchema.index({ hospitalId: 1 });
ProfileSchema.index({ phone: 1 }, { sparse: true }); // For patient phone lookup


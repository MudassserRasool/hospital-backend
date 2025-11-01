import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingsDocument = Settings & Document;

@Schema({ timestamps: true })
export class Settings {
  @Prop({ required: true, default: 'Hospital Management System' })
  systemName: string;

  @Prop({ required: true, default: 'admin@hospital.com' })
  systemEmail: string;

  @Prop({
    type: {
      enableGoogleOAuth: { type: Boolean, default: true },
      enablePayments: { type: Boolean, default: true },
      enableNotifications: { type: Boolean, default: true },
    },
    default: {
      enableGoogleOAuth: true,
      enablePayments: true,
      enableNotifications: true,
    },
  })
  features?: {
    enableGoogleOAuth: boolean;
    enablePayments: boolean;
    enableNotifications: boolean;
  };

  @Prop({
    type: {
      maxHospitals: { type: Number, default: 100 },
      maxStaffPerHospital: { type: Number, default: 500 },
    },
    default: {
      maxHospitals: 100,
      maxStaffPerHospital: 500,
    },
  })
  limits?: {
    maxHospitals: number;
    maxStaffPerHospital: number;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

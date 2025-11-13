import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  staffId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: true })
  hospitalId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  checkInTime: Date;

  @Prop()
  checkOutTime?: Date;

  @Prop()
  workHours?: number;

  @Prop({ default: false })
  locationVerified: boolean;

  @Prop()
  wifiSSID?: string;

  @Prop({ type: { latitude: Number, longitude: Number } })
  gpsCoordinates?: { latitude: number; longitude: number };

  @Prop({ enum: ['present', 'absent', 'half_day', 'leave'], default: 'present' })
  status: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

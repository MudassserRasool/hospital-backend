import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ select: false }) // Only for credential users
  password?: string;

  @Prop({ unique: true, sparse: true }) // Only for Google OAuth users
  googleId?: string;

  @Prop({
    required: true,
    enum: ['super_admin', 'owner', 'receptionist', 'doctor', 'nurse', 'staff', 'patient'],
  })
  role: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  phone?: string;

  @Prop()
  profilePicture?: string;

  @Prop({ type: Types.ObjectId, ref: 'Hospital' })
  hospitalId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop()
  blockedReason?: string;

  @Prop()
  blockedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  blockedBy?: Types.ObjectId;

  @Prop({ type: [String], select: false })
  refreshTokens?: string[];

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  deviceToken?: string; // For push notifications

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Index for performance
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ hospitalId: 1 });
UserSchema.index({ role: 1 });

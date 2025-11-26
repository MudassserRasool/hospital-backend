import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AVATAR_UTL, GENDER_TYPES_ARRAY } from 'src/common/constants';
import ROLES from 'src/common/constants/roles.constant';

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
    enum: ROLES,
  })
  role: string;

  // gender
  @Prop({ required: false, enum: GENDER_TYPES_ARRAY })
  gender?: string;

  @Prop({
    required: false,
    default: function () {
      // use 'this' to refer to the document instance
      if (this.gender === 'female') {
        return AVATAR_UTL(47);
      }
      return AVATAR_UTL(12);
    },
  })
  avatar?: string;

  @Prop({ required: false })
  firstName: string;

  @Prop({ required: false })
  lastName: string;

  @Prop()
  phone?: string;

  @Prop()
  profilePicture?: string;

  @Prop({ type: Types.ObjectId, ref: 'Hospital' })
  hospitalId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  // is verified
  @Prop({ default: false })
  isVerified: boolean;

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
  experience?: string;

  @Prop()
  licenseNumber?: string;

  @Prop()
  specialization?: string;

  @Prop({ type: [Date], default: [] })
  timing?: Date[];

  @Prop()
  lastLoginAt?: Date;

  @Prop({ type: [String], default: [] })
  deviceTokens?: string[]; // For push notifications (Expo push tokens)

  @Prop({ type: String })
  otp?: string;

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

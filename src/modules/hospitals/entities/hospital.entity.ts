import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HospitalDocument = Hospital & Document;

@Schema({ timestamps: true })
export class Hospital {
  @Prop({ required: true })
  name: string;

  @Prop()
  logo?: string;

  @Prop({
    type: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    required: true,
  })
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @Prop({
    type: {
      phone: String,
      email: String,
      website: String,
    },
    required: true,
  })
  contact: {
    phone: string;
    email: string;
    website?: string;
  };

  @Prop({
    type: [
      {
        day: String,
        openTime: String,
        closeTime: String,
      },
    ],
  })
  workingHours?: Array<{
    day: string;
    openTime: string;
    closeTime: string;
  }>;

  @Prop({ type: [String], default: [] })
  specialties: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({
    type: {
      easyPaisaMerchantId: String,
      easyPaisaStoreId: String,
      accountDetails: Object,
    },
  })
  paymentConfig?: {
    easyPaisaMerchantId?: string;
    easyPaisaStoreId?: string;
    accountDetails?: any;
  };

  @Prop()
  wifiSSID?: string;

  @Prop({
    type: {
      latitude: Number,
      longitude: Number,
    },
  })
  location?: {
    latitude: number;
    longitude: number;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  facilities?: string[];

  @Prop({ default: 0 })
  totalStaff?: number;

  @Prop({ default: 0 })
  totalPatients?: number;

  @Prop({ required: true })
  mobilePackageId: string;
  //  add index

  createdAt?: Date;
  updatedAt?: Date;
}

export const HospitalSchema = SchemaFactory.createForClass(Hospital);

// Indexes
HospitalSchema.index({ name: 1 });
HospitalSchema.index({ ownerId: 1 });
HospitalSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
HospitalSchema.index({ mobilePackageId: 1 });

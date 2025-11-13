import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReceiptTemplateDocument = ReceiptTemplate & Document;

@Schema({ timestamps: true })
export class ReceiptTemplate {
  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: true })
  hospitalId: Types.ObjectId;

  @Prop({ required: true })
  templateName: string;

  @Prop({ type: Object, required: true })
  templateContent: any;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReceiptTemplateSchema = SchemaFactory.createForClass(ReceiptTemplate);

// Indexes
ReceiptTemplateSchema.index({ hospitalId: 1 });
ReceiptTemplateSchema.index({ isActive: 1 });

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Hospital, HospitalSchema } from '../hospitals/entities/hospital.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { ReceiptTemplate, ReceiptTemplateSchema } from '../receipt-templates/entities/receipt-template.entity';
import { Settings, SettingsSchema } from '../settings/entities/settings.entity';
import { AuditLog, AuditLogSchema } from '../audit-logs/entities/audit-log.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
      { name: User.name, schema: UserSchema },
      { name: ReceiptTemplate.name, schema: ReceiptTemplateSchema },
      { name: Settings.name, schema: SettingsSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}


import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReceptionController } from './reception.controller';
import { ReceptionService } from './reception.service';
import { Appointment, AppointmentSchema } from '../appointments/entities/appointment.entity';
import { Patient, PatientSchema } from '../patients/entities/patient.entity';
import { ProfilesModule } from '../profiles/profiles.module';
import { User, UserSchema } from '../users/entities/user.entity';
import { Receipt, ReceiptSchema } from '../receipts/entities/receipt.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: User.name, schema: UserSchema },
      { name: Receipt.name, schema: ReceiptSchema },
    ]),
    ProfilesModule,
  ],
  controllers: [ReceptionController],
  providers: [ReceptionService],
  exports: [ReceptionService],
})
export class ReceptionModule {}


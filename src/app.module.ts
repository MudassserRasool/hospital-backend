import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Config
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

// Core Modules
import { CacheModule } from './core/cache/cache.module';
import { DatabaseModule } from './core/database/database.module';
import { LoggingModule } from './core/logging/logging.module';
import { MailerModule } from './core/mailer/mailer.module';
import { SchedulerModule } from './core/scheduler/scheduler.module';

// Integration Modules
import { NotificationModule } from './integrations/notification/notification.module';
import { PaymentModule } from './integrations/payment/payment.module';

// Feature Modules
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { CheckupsModule } from './modules/checkups/checkups.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { NotificationTemplatesModule } from './modules/notification-templates/notification-templates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OwnersModule } from './modules/owners/owners.module';
import { PatientsModule } from './modules/patients/patients.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ReceiptTemplatesModule } from './modules/receipt-templates/receipt-templates.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { ReceptionistsModule } from './modules/receptionists/receptionists.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RolesModule } from './modules/roles/roles.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StaffModule } from './modules/staff/staff.module';
import { TimeSlotsModule } from './modules/time-slots/time-slots.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';
import { VitalsModule } from './modules/vitals/vitals.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { WorkHoursModule } from './modules/work-hours/work-hours.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
      },
    ]),

    // Core modules
    DatabaseModule,
    LoggingModule,
    CacheModule,
    SchedulerModule,
    MailerModule,

    // Integration modules
    NotificationModule,
    PaymentModule,

    // Feature modules
    AuthModule,
    UsersModule,
    PatientsModule,
    StaffModule,
    OwnersModule,
    ReceptionistsModule,
    HospitalsModule,
    DepartmentsModule,
    AppointmentsModule,
    SchedulesModule,
    TimeSlotsModule,
    VitalsModule,
    MedicalRecordsModule,
    CheckupsModule,
    PaymentsModule,
    WalletsModule,
    RefundsModule,
    TransactionsModule,
    AttendanceModule,
    LeavesModule,
    WorkHoursModule,
    NotificationsModule,
    NotificationTemplatesModule,
    ReceiptsModule,
    ReceiptTemplatesModule,
    AnalyticsModule,
    ReportsModule,
    SettingsModule,
    RolesModule,
    PermissionsModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

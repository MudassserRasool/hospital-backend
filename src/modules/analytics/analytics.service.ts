import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Appointment,
  AppointmentDocument,
} from '../appointments/entities/appointment.entity';
import { Payment, PaymentDocument } from '../payments/entities/payment.entity';
import { ProfilesService } from '../profiles/profiles.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private profilesService: ProfilesService,
  ) {}

  async getDashboardStats(hospitalId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalAppointments,
      todayAppointments,
      totalPatients,
      totalRevenue,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
    ] = await Promise.all([
      this.appointmentModel.countDocuments({ hospitalId }),
      this.appointmentModel.countDocuments({
        hospitalId,
        date: { $gte: today },
      }),
      this.profilesService.findAll({ role: 'patient' }).then(profiles => profiles.length),
      this.paymentModel.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.appointmentModel.countDocuments({ hospitalId, status: 'completed' }),
      this.appointmentModel.countDocuments({ hospitalId, status: 'cancelled' }),
      this.appointmentModel.countDocuments({ hospitalId, status: 'no_show' }),
    ]);

    return {
      totalAppointments,
      todayAppointments,
      totalPatients,
      totalRevenue: totalRevenue[0]?.total || 0,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      attendanceRate:
        totalAppointments > 0
          ? ((completedAppointments / totalAppointments) * 100).toFixed(2)
          : 0,
      noShowRate:
        totalAppointments > 0
          ? ((noShowAppointments / totalAppointments) * 100).toFixed(2)
          : 0,
      cancellationRate:
        totalAppointments > 0
          ? ((cancelledAppointments / totalAppointments) * 100).toFixed(2)
          : 0,
    };
  }

  async getAppointmentAnalytics(
    hospitalId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const match: any = { hospitalId };
    if (startDate && endDate) {
      match.date = { $gte: startDate, $lte: endDate };
    }

    const appointmentsByStatus = await this.appointmentModel.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const appointmentsByDoctor = await this.appointmentModel.aggregate([
      { $match: match },
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return {
      byStatus: appointmentsByStatus,
      byDoctor: appointmentsByDoctor,
    };
  }

  async getRevenueAnalytics(
    hospitalId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const match: any = { status: 'completed' };
    if (startDate && endDate) {
      match.createdAt = { $gte: startDate, $lte: endDate };
    }

    const revenueByDate = await this.paymentModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueByMethod = await this.paymentModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$method',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      byDate: revenueByDate,
      byMethod: revenueByMethod,
    };
  }
}

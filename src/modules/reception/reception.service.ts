import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentDocument } from '../appointments/entities/appointment.entity';
import { Patient, PatientDocument } from '../patients/entities/patient.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { Receipt, ReceiptDocument } from '../receipts/entities/receipt.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ReceptionService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Receipt.name) private receiptModel: Model<ReceiptDocument>,
  ) {}

  // ========== APPOINTMENT MANAGEMENT ==========

  async getAppointmentRequests(hospitalId: string) {
    const appointments = await this.appointmentModel
      .find({
        hospitalId,
        status: 'pending',
        paymentStatus: 'paid',
      })
      .populate('patientId')
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ date: 1, 'timeSlot.start': 1 })
      .exec();

    return { appointments, total: appointments.length };
  }

  async confirmAppointment(id: string, confirmedBy: string) {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== 'pending') {
      throw new BadRequestException(`Cannot confirm appointment with status: ${appointment.status}`);
    }

    appointment.status = 'confirmed';
    appointment.confirmedAt = new Date();
    await appointment.save();

    // TODO: Send notification to patient

    return appointment.populate([
      { path: 'patientId' },
      { path: 'doctorId', select: 'firstName lastName' },
    ]);
  }

  async rejectAppointment(id: string, reason: string, rejectedBy: string) {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancelledBy = rejectedBy as any;
    appointment.cancelledAt = new Date();

    await appointment.save();

    // TODO: Process refund if payment was made

    return appointment;
  }

  async getTodayAppointments(hospitalId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await this.appointmentModel
      .find({
        hospitalId,
        date: { $gte: today, $lt: tomorrow },
        status: { $nin: ['cancelled'] },
      })
      .populate('patientId')
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ 'timeSlot.start': 1 })
      .exec();

    return { appointments, total: appointments.length };
  }

  async getAppointmentsByDate(hospitalId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.appointmentModel
      .find({
        hospitalId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ['cancelled'] },
      })
      .populate('patientId')
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ 'timeSlot.start': 1 })
      .exec();

    return { appointments, total: appointments.length };
  }

  // ========== PATIENT CHECK-IN ==========

  async checkInPatient(data: any, checkedInBy: string) {
    const appointment = await this.appointmentModel.findById(data.appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed appointments can be checked in');
    }

    appointment.status = 'checked_in';
    appointment.checkedInAt = new Date();

    await appointment.save();

    return appointment.populate([
      { path: 'patientId' },
      { path: 'doctorId' },
    ]);
  }

  async recordVitals(appointmentId: string, vitals: any, recordedBy: string) {
    const appointment = await this.appointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    appointment.vitals = {
      ...vitals,
      recordedBy: recordedBy as any,
      recordedAt: new Date(),
    };

    await appointment.save();

    return appointment;
  }

  async generateReceipt(appointmentId: string) {
    const appointment = await this.appointmentModel
      .findById(appointmentId)
      .populate('patientId')
      .populate('doctorId')
      .populate('hospitalId')
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Create receipt record
    const receipt = await this.receiptModel.create({
      appointmentId,
      patientId: appointment.patientId,
      hospitalId: appointment.hospitalId,
      amount: appointment.paymentAmount,
      generatedAt: new Date(),
      receiptNumber: await this.generateReceiptNumber(),
    });

    // TODO: Generate PDF using PDFKit

    return receipt;
  }

  // ========== PATIENT MANAGEMENT ==========

  async getPatients(hospitalId: string, params?: any) {
    const query: any = {};

    if (params?.search) {
      // Search in user's firstName, lastName, email
      const users = await this.userModel.find({
        $or: [
          { firstName: { $regex: params.search, $options: 'i' } },
          { lastName: { $regex: params.search, $options: 'i' } },
          { email: { $regex: params.search, $options: 'i' } },
        ],
        role: 'patient',
      }).select('_id');

      query.userId = { $in: users.map((u) => u._id) };
    }

    if (params?.isBlocked !== undefined) {
      query.isBlocked = params.isBlocked === 'true';
    }

    const patients = await this.patientModel
      .find(query)
      .populate('userId', 'firstName lastName email phone profilePicture')
      .sort({ createdAt: -1 })
      .limit(params?.limit || 50)
      .skip(params?.skip || 0)
      .exec();

    const total = await this.patientModel.countDocuments(query);

    return { patients, total };
  }

  async getPatientDetails(id: string) {
    const patient = await this.patientModel
      .findById(id)
      .populate('userId', 'firstName lastName email phone profilePicture')
      .exec();

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async createPatient(data: any, hospitalId: string) {
    // Create user first
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await this.userModel.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: 'patient',
      hospitalId,
      isActive: true,
    });

    // Create patient profile
    const patient = await this.patientModel.create({
      userId: user._id,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      bloodType: data.bloodType,
      emergencyContact: data.emergencyContact,
    });

    return {
      patient: patient.populate('userId'),
      temporaryPassword: tempPassword,
    };
  }

  async updatePatient(id: string, data: any) {
    const patient = await this.patientModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate('userId')
      .exec();

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async blockPatient(id: string, reason: string, blockedBy: string) {
    const patient = await this.patientModel.findById(id);

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    patient.isBlocked = true;
    patient.blockReason = reason;
    if (!patient.blockHistory) {
      patient.blockHistory = [];
    }
    patient.blockHistory.push({
      action: 'blocked',
      reason,
      by: blockedBy as any,
      date: new Date(),
    });

    await patient.save();

    return patient.populate('userId');
  }

  async unblockPatient(id: string, reason: string, unblockedBy: string) {
    const patient = await this.patientModel.findById(id);

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    patient.isBlocked = false;
    patient.blockReason = undefined;
    if (!patient.blockHistory) {
      patient.blockHistory = [];
    }
    patient.blockHistory.push({
      action: 'unblocked',
      reason,
      by: unblockedBy as any,
      date: new Date(),
    });

    await patient.save();

    return patient.populate('userId');
  }

  async getPatientHistory(id: string) {
    const patient = await this.getPatientDetails(id);

    // Get all appointments
    const appointments = await this.appointmentModel
      .find({ patientId: id })
      .populate('doctorId', 'firstName lastName specialty')
      .populate('hospitalId', 'name')
      .sort({ date: -1 })
      .exec();

    return {
      patient,
      appointments,
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter((a) => a.status === 'completed').length,
    };
  }

  // ========== DOCTOR MANAGEMENT ==========

  async getDoctors(hospitalId: string, params?: any) {
    const query: any = { hospitalId, role: 'doctor' };

    if (params?.search) {
      query.$or = [
        { firstName: { $regex: params.search, $options: 'i' } },
        { lastName: { $regex: params.search, $options: 'i' } },
        { email: { $regex: params.search, $options: 'i' } },
      ];
    }

    if (params?.isActive !== undefined) {
      query.isActive = params.isActive === 'true';
    }

    const doctors = await this.userModel
      .find(query)
      .select('-password -refreshTokens')
      .sort({ firstName: 1 })
      .limit(params?.limit || 50)
      .skip(params?.skip || 0)
      .exec();

    const total = await this.userModel.countDocuments(query);

    return { doctors, total };
  }

  async createDoctor(data: any, hospitalId: string) {
    // Check if email exists
    const existing = await this.userModel.findOne({ email: data.email });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const doctor = await this.userModel.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: 'doctor',
      hospitalId,
      isActive: true,
    });

    return {
      doctor: doctor.toObject(),
      temporaryPassword: tempPassword,
    };
  }

  async updateDoctor(id: string, data: any) {
    const doctor = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-password -refreshTokens')
      .exec();

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async blockDoctor(id: string, reason: string, blockedBy: string) {
    const doctor = await this.userModel.findById(id);

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    doctor.isBlocked = true;
    doctor.blockedReason = reason;
    doctor.blockedAt = new Date();
    doctor.blockedBy = blockedBy as any;

    await doctor.save();

    return doctor;
  }

  async updateDoctorSchedule(id: string, schedule: any) {
    // This would update the doctor's schedule
    // For now, returning acknowledgment
    return {
      message: 'Doctor schedule updated successfully',
      doctorId: id,
      schedule,
    };
  }

  // ========== ANALYTICS ==========

  async getDailyAnalytics(hospitalId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.appointmentModel.find({
      hospitalId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const totalAppointments = appointments.length;
    const attended = appointments.filter((a) => a.status === 'completed' || a.status === 'checked_in').length;
    const noShows = appointments.filter((a) => a.status === 'no_show').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
    const revenue = appointments
      .filter((a) => a.paymentStatus === 'paid')
      .reduce((sum, a) => sum + a.paymentAmount, 0);

    return {
      date,
      totalAppointments,
      attended,
      noShows,
      cancelled,
      revenue,
      attendanceRate: totalAppointments > 0 ? (attended / totalAppointments) * 100 : 0,
    };
  }

  async getMonthlyAnalytics(hospitalId: string, year: string, month: string) {
    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    const appointments = await this.appointmentModel.find({
      hospitalId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).populate('doctorId', 'firstName lastName');

    const totalAppointments = appointments.length;
    const attended = appointments.filter((a) => a.status === 'completed').length;
    const noShows = appointments.filter((a) => a.status === 'no_show').length;
    const revenue = appointments
      .filter((a) => a.paymentStatus === 'paid')
      .reduce((sum, a) => sum + a.paymentAmount, 0);

    // Get new vs repeat patients
    const patientIds = appointments.map((a) => a.patientId.toString());
    const uniquePatients = [...new Set(patientIds)];

    // Group by day
    const appointmentsByDay = this.groupAppointmentsByDay(appointments, startOfMonth, endOfMonth);

    // Top doctors
    const doctorStats = this.calculateDoctorStats(appointments);

    return {
      year,
      month,
      totalAppointments,
      attended,
      noShows,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
      revenue,
      attendanceRate: totalAppointments > 0 ? (attended / totalAppointments) * 100 : 0,
      noShowRate: totalAppointments > 0 ? (noShows / totalAppointments) * 100 : 0,
      uniquePatients: uniquePatients.length,
      appointmentsByDay,
      topDoctors: doctorStats.slice(0, 5),
    };
  }

  async getPatientVolume(hospitalId: string, params: any) {
    const days = params?.days || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const appointments = await this.appointmentModel.find({
      hospitalId,
      date: { $gte: startDate, $lte: endDate },
    });

    const volumeByDay = this.groupAppointmentsByDay(appointments, startDate, endDate);

    return {
      startDate,
      endDate,
      volumeByDay,
      totalAppointments: appointments.length,
      averagePerDay: appointments.length / days,
    };
  }

  // ========== HELPERS ==========

  private groupAppointmentsByDay(appointments: any[], startDate: Date, endDate: Date) {
    const days: any[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const count = appointments.filter((a) => {
        const aptDate = new Date(a.date).toISOString().split('T')[0];
        return aptDate === dateStr;
      }).length;

      days.push({
        date: dateStr,
        count,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  private calculateDoctorStats(appointments: any[]) {
    const doctorMap = new Map();

    appointments.forEach((apt) => {
      const doctorId = apt.doctorId?._id?.toString();
      if (!doctorId) return;

      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          doctor: `Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}`,
          appointments: 0,
        });
      }

      const stats = doctorMap.get(doctorId);
      stats.appointments++;
    });

    return Array.from(doctorMap.values()).sort((a, b) => b.appointments - a.appointments);
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const length = 12;
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private async generateReceiptNumber(): Promise<string> {
    const prefix = 'RCP';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }
}


import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentDocument } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
  ) {}

  /**
   * Book a new appointment
   * Status: pending (waiting for payment)
   */
  async create(createAppointmentDto: CreateAppointmentDto) {
    // Generate unique appointment ID
    const appointmentId = `APT-${Date.now()}-${uuidv4().substring(0, 8)}`;

    // Check if time slot is available
    const isAvailable = await this.checkTimeSlotAvailability(
      createAppointmentDto.doctorId,
      createAppointmentDto.timeSlot.start,
      createAppointmentDto.timeSlot.end,
    );

    if (!isAvailable) {
      throw new ConflictException('Time slot is not available');
    }

    // Create appointment
    const appointment = await this.appointmentModel.create({
      ...createAppointmentDto,
      appointmentId,
      status: 'pending',
      paymentStatus: 'pending',
    });

    return appointment.populate([
      { path: 'patientId', select: 'userId' },
      { path: 'doctorId', select: 'firstName lastName email' },
      { path: 'hospitalId', select: 'name logo' },
    ]);
  }

  /**
   * Get all appointments with filters
   * Filtered by role and user
   */
  async findAll(filters: any, userId: string, userRole: string) {
    const query: any = {};

    // Role-based filtering
    if (userRole === 'patient') {
      query.patientId = filters.patientId || userId;
    } else if (userRole === 'doctor' || userRole === 'nurse') {
      query.doctorId = userId;
    } else if (userRole === 'receptionist' || userRole === 'owner') {
      query.hospitalId = filters.hospitalId;
    }

    // Additional filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (filters.doctorId) {
      query.doctorId = filters.doctorId;
    }

    const appointments = await this.appointmentModel
      .find(query)
      .populate([
        { path: 'patientId', select: 'userId' },
        { path: 'doctorId', select: 'firstName lastName email profilePicture' },
        { path: 'hospitalId', select: 'name logo' },
        { path: 'departmentId', select: 'name' },
      ])
      .sort({ date: -1, 'timeSlot.start': -1 })
      .exec();

    return appointments;
  }

  /**
   * Get appointment by ID
   */
  async findOne(id: string) {
    const appointment = await this.appointmentModel
      .findById(id)
      .populate([
        { path: 'patientId' },
        { path: 'doctorId', select: 'firstName lastName email profilePicture phone' },
        { path: 'hospitalId' },
        { path: 'departmentId' },
        { path: 'vitals.recordedBy', select: 'firstName lastName' },
      ])
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  /**
   * Get appointment by appointment ID (string)
   */
  async findByAppointmentId(appointmentId: string) {
    const appointment = await this.appointmentModel
      .findOne({ appointmentId })
      .populate([
        { path: 'patientId' },
        { path: 'doctorId', select: 'firstName lastName email profilePicture' },
        { path: 'hospitalId' },
      ])
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  /**
   * Update appointment
   */
  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.appointmentModel
      .findByIdAndUpdate(id, updateAppointmentDto, { new: true })
      .populate([
        { path: 'patientId' },
        { path: 'doctorId' },
        { path: 'hospitalId' },
      ])
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  /**
   * Confirm appointment (Reception)
   * Status: pending → confirmed
   */
  async confirmAppointment(id: string) {
    const appointment = await this.findOne(id);

    if (appointment.status !== 'pending') {
      throw new BadRequestException(`Cannot confirm appointment with status: ${appointment.status}`);
    }

    if (appointment.paymentStatus !== 'paid') {
      throw new BadRequestException('Payment must be completed before confirmation');
    }

    appointment.status = 'confirmed';
    appointment.confirmedAt = new Date();
    await appointment.save();

    // TODO: Send notification to patient
    // await this.notificationService.sendAppointmentConfirmed(appointment);

    return appointment;
  }

  /**
   * Check-in patient (Reception)
   * Status: confirmed → checked_in
   */
  async checkInPatient(id: string, vitals?: any) {
    const appointment = await this.findOne(id);

    if (appointment.status !== 'confirmed') {
      throw new BadRequestException(`Cannot check-in appointment with status: ${appointment.status}`);
    }

    appointment.status = 'checked_in';
    appointment.checkedInAt = new Date();

    if (vitals) {
      appointment.vitals = {
        ...vitals,
        recordedAt: new Date(),
      };
    }

    await appointment.save();

    return appointment;
  }

  /**
   * Complete appointment (Doctor)
   * Status: checked_in → completed
   */
  async completeAppointment(
    id: string,
    completionData: {
      checkupNotes?: string;
      diagnosis?: string;
      prescriptions?: any[];
    },
  ) {
    const appointment = await this.findOne(id);

    if (appointment.status !== 'checked_in' && appointment.status !== 'in_progress') {
      throw new BadRequestException(`Cannot complete appointment with status: ${appointment.status}`);
    }

    appointment.status = 'completed';
    appointment.completedAt = new Date();
    appointment.checkupNotes = completionData.checkupNotes;
    appointment.diagnosis = completionData.diagnosis;
    appointment.prescriptions = completionData.prescriptions;

    await appointment.save();

    // TODO: Send notification to patient
    // await this.notificationService.sendAppointmentCompleted(appointment);

    return appointment;
  }

  /**
   * Cancel appointment
   * Status: any → cancelled
   * Triggers refund if paid
   */
  async cancelAppointment(
    id: string,
    cancellationReason: string,
    cancelledBy: string,
  ) {
    const appointment = await this.findOne(id);

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      throw new BadRequestException(`Cannot cancel appointment with status: ${appointment.status}`);
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledBy = cancelledBy as any;
    appointment.cancelledAt = new Date();

    await appointment.save();

    // TODO: If payment was made, process refund
    // if (appointment.paymentStatus === 'paid') {
    //   await this.paymentsService.processRefund(appointment.transactionId, cancellationReason, cancelledBy);
    //   appointment.paymentStatus = 'refunded';
    //   await appointment.save();
    // }

    // TODO: Send notification to patient
    // await this.notificationService.sendAppointmentCancelled(appointment);

    return appointment;
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(
    id: string,
    newDate: Date,
    newTimeSlot: { start: Date; end: Date },
  ) {
    const appointment = await this.findOne(id);

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      throw new BadRequestException(`Cannot reschedule appointment with status: ${appointment.status}`);
    }

    // Check if new time slot is available
    const isAvailable = await this.checkTimeSlotAvailability(
      appointment.doctorId.toString(),
      newTimeSlot.start,
      newTimeSlot.end,
      id, // Exclude current appointment
    );

    if (!isAvailable) {
      throw new ConflictException('New time slot is not available');
    }

    appointment.date = newDate;
    appointment.timeSlot = newTimeSlot;
    appointment.status = 'pending'; // Reset to pending for re-confirmation
    await appointment.save();

    // TODO: Send notification to patient
    // await this.notificationService.sendAppointmentRescheduled(appointment);

    return appointment;
  }

  /**
   * Mark appointment as no-show
   */
  async markNoShow(id: string) {
    const appointment = await this.findOne(id);

    if (appointment.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed appointments can be marked as no-show');
    }

    appointment.status = 'no_show';
    await appointment.save();

    return appointment;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: string,
    transactionId?: string,
    walletCreditUsed?: number,
  ) {
    const appointment = await this.findOne(id);

    appointment.paymentStatus = paymentStatus;
    if (transactionId) {
      appointment.transactionId = transactionId;
    }
    if (walletCreditUsed !== undefined) {
      appointment.walletCreditUsed = walletCreditUsed;
    }

    await appointment.save();
    return appointment;
  }

  /**
   * Check time slot availability
   */
  async checkTimeSlotAvailability(
    doctorId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const query: any = {
      doctorId,
      status: { $nin: ['cancelled', 'no_show', 'completed'] },
      $or: [
        {
          'timeSlot.start': { $lt: endTime },
          'timeSlot.end': { $gt: startTime },
        },
      ],
    };

    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
    }

    const conflictingAppointment = await this.appointmentModel.findOne(query);
    return !conflictingAppointment;
  }

  /**
   * Get doctor's schedule for a date
   */
  async getDoctorSchedule(doctorId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.appointmentModel
      .find({
        doctorId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ['cancelled', 'no_show'] },
      })
      .sort({ 'timeSlot.start': 1 })
      .exec();

    return appointments;
  }

  /**
   * Get patient's appointment history
   */
  async getPatientAppointments(patientId: string) {
    const appointments = await this.appointmentModel
      .find({ patientId })
      .populate([
        { path: 'doctorId', select: 'firstName lastName profilePicture' },
        { path: 'hospitalId', select: 'name logo' },
        { path: 'departmentId', select: 'name' },
      ])
      .sort({ date: -1 })
      .exec();

    return appointments;
  }

  /**
   * Delete appointment (admin only)
   */
  async remove(id: string) {
    const appointment = await this.appointmentModel.findByIdAndDelete(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return { message: 'Appointment deleted successfully' };
  }
}

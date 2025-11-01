import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentDocument } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    // Generate unique appointment ID
    const appointmentId = await this.generateAppointmentId();

    // Check for doctor availability (basic check - can be enhanced)
    const conflictingAppointment = await this.appointmentModel.findOne({
      doctorId: createAppointmentDto.doctorId,
      date: createAppointmentDto.date,
      status: { $nin: ['cancelled', 'no_show'] },
      $or: [
        {
          'timeSlot.start': {
            $gte: createAppointmentDto.timeSlot.start,
            $lt: createAppointmentDto.timeSlot.end,
          },
        },
        {
          'timeSlot.end': {
            $gt: createAppointmentDto.timeSlot.start,
            $lte: createAppointmentDto.timeSlot.end,
          },
        },
      ],
    });

    if (conflictingAppointment) {
      throw new ConflictException('Doctor is not available at this time slot');
    }

    const appointment = await this.appointmentModel.create({
      ...createAppointmentDto,
      appointmentId,
      status: 'pending',
      paymentStatus: 'pending',
    });

    return appointment.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'firstName lastName email phone' } },
      { path: 'doctorId', select: 'firstName lastName email phone' },
      { path: 'hospitalId', select: 'name logo address' },
      { path: 'departmentId', select: 'name' },
    ]);
  }

  async findAll(filters?: any) {
    const query = filters || {};
    const appointments = await this.appointmentModel
      .find(query)
      .populate([
        { path: 'patientId', populate: { path: 'userId', select: 'firstName lastName email phone' } },
        { path: 'doctorId', select: 'firstName lastName email phone' },
        { path: 'hospitalId', select: 'name logo' },
        { path: 'departmentId', select: 'name' },
      ])
      .sort({ date: -1 })
      .exec();
    return appointments;
  }

  async findOne(id: string) {
    const appointment = await this.appointmentModel
      .findById(id)
      .populate([
        { path: 'patientId', populate: { path: 'userId', select: 'firstName lastName email phone profilePicture' } },
        { path: 'doctorId', select: 'firstName lastName email phone profilePicture' },
        { path: 'hospitalId', select: 'name logo address contact' },
        { path: 'departmentId', select: 'name description' },
        { path: 'vitals.recordedBy', select: 'firstName lastName role' },
        { path: 'cancelledBy', select: 'firstName lastName role' },
      ])
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async findByAppointmentId(appointmentId: string) {
    const appointment = await this.appointmentModel
      .findOne({ appointmentId })
      .populate([
        { path: 'patientId', populate: { path: 'userId' } },
        { path: 'doctorId' },
        { path: 'hospitalId' },
      ])
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.appointmentModel
      .findByIdAndUpdate(id, updateAppointmentDto, { new: true })
      .populate([
        { path: 'patientId', populate: { path: 'userId' } },
        { path: 'doctorId' },
        { path: 'hospitalId' },
      ])
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async confirmAppointment(id: string) {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== 'pending') {
      throw new BadRequestException('Only pending appointments can be confirmed');
    }

    appointment.status = 'confirmed';
    appointment.confirmedAt = new Date();
    await appointment.save();

    return appointment.populate([
      { path: 'patientId', populate: { path: 'userId' } },
      { path: 'doctorId' },
      { path: 'hospitalId' },
    ]);
  }

  async checkIn(id: string, userId: string) {
    const appointment = await this.appointmentModel.findById(id);

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
      { path: 'patientId', populate: { path: 'userId' } },
      { path: 'doctorId' },
      { path: 'hospitalId' },
    ]);
  }

  async recordVitals(id: string, vitals: any, recordedBy: string) {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== 'checked_in') {
      throw new BadRequestException('Patient must be checked in to record vitals');
    }

    appointment.vitals = {
      ...vitals,
      recordedBy,
      recordedAt: new Date(),
    };

    appointment.status = 'in_progress';
    await appointment.save();

    return appointment.populate([
      { path: 'patientId', populate: { path: 'userId' } },
      { path: 'doctorId' },
      { path: 'vitals.recordedBy', select: 'firstName lastName role' },
    ]);
  }

  async completeAppointment(id: string, data: any) {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (!['checked_in', 'in_progress'].includes(appointment.status)) {
      throw new BadRequestException('Invalid appointment status for completion');
    }

    appointment.status = 'completed';
    appointment.completedAt = new Date();
    
    if (data.checkupNotes) appointment.checkupNotes = data.checkupNotes;
    if (data.diagnosis) appointment.diagnosis = data.diagnosis;
    if (data.prescriptions) appointment.prescriptions = data.prescriptions;

    await appointment.save();

    return appointment.populate([
      { path: 'patientId', populate: { path: 'userId' } },
      { path: 'doctorId' },
      { path: 'hospitalId' },
    ]);
  }

  async cancelAppointment(id: string, reason: string, cancelledBy: string) {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
      throw new BadRequestException('Cannot cancel this appointment');
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancelledBy = cancelledBy as any;
    appointment.cancelledAt = new Date();

    await appointment.save();

    return appointment.populate([
      { path: 'patientId', populate: { path: 'userId' } },
      { path: 'doctorId' },
      { path: 'cancelledBy', select: 'firstName lastName role' },
    ]);
  }

  async markNoShow(id: string) {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed appointments can be marked as no-show');
    }

    appointment.status = 'no_show';
    await appointment.save();

    return appointment.populate([
      { path: 'patientId', populate: { path: 'userId' } },
      { path: 'doctorId' },
    ]);
  }

  async rescheduleAppointment(id: string, newDate: Date, newTimeSlot: any) {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      throw new BadRequestException('Cannot reschedule this appointment');
    }

    // Check for conflicts
    const conflictingAppointment = await this.appointmentModel.findOne({
      doctorId: appointment.doctorId,
      date: newDate,
      status: { $nin: ['cancelled', 'no_show'] },
      _id: { $ne: appointment._id },
      $or: [
        {
          'timeSlot.start': {
            $gte: newTimeSlot.start,
            $lt: newTimeSlot.end,
          },
        },
        {
          'timeSlot.end': {
            $gt: newTimeSlot.start,
            $lte: newTimeSlot.end,
          },
        },
      ],
    });

    if (conflictingAppointment) {
      throw new ConflictException('Doctor is not available at this time slot');
    }

    appointment.date = newDate;
    appointment.timeSlot = newTimeSlot;
    appointment.status = 'rescheduled';
    await appointment.save();

    return appointment.populate([
      { path: 'patientId', populate: { path: 'userId' } },
      { path: 'doctorId' },
      { path: 'hospitalId' },
    ]);
  }

  async getAppointmentsByPatient(patientId: string) {
    return this.findAll({ patientId });
  }

  async getAppointmentsByDoctor(doctorId: string, date?: Date) {
    const query: any = { doctorId };
    if (date) {
      query.date = date;
    }
    return this.findAll(query);
  }

  async getAppointmentsByHospital(hospitalId: string, filters?: any) {
    return this.findAll({ hospitalId, ...filters });
  }

  async getUpcomingAppointments(userId: string, role: string) {
    const query: any = {
      status: { $in: ['pending', 'confirmed'] },
      'timeSlot.start': { $gte: new Date() },
    };

    if (role === 'patient') {
      query.patientId = userId;
    } else if (role === 'doctor') {
      query.doctorId = userId;
    }

    return this.findAll(query);
  }

  private async generateAppointmentId(): Promise<string> {
    const prefix = 'APT';
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
  }

  async remove(id: string) {
    const appointment = await this.appointmentModel.findByIdAndDelete(id).exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return { message: 'Appointment deleted successfully' };
  }
}

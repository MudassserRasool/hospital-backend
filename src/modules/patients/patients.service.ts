import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
  ) {}

  async create(createPatientDto: CreatePatientDto) {
    // Check if patient profile already exists for this user
    const existing = await this.patientModel.findOne({ userId: createPatientDto.userId });
    if (existing) {
      throw new ConflictException('Patient profile already exists for this user');
    }

    // Generate medical record number if not provided
    if (!createPatientDto.medicalRecordNumber) {
      createPatientDto.medicalRecordNumber = await this.generateMedicalRecordNumber();
    }

    const patient = await this.patientModel.create({
      ...createPatientDto,
      isBlocked: false,
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      noShowAppointments: 0,
    });

    return patient.populate('userId', 'firstName lastName email phone profilePicture');
  }

  async findAll(filters?: any) {
    const query = filters || {};
    const patients = await this.patientModel
      .find(query)
      .populate('userId', 'firstName lastName email phone profilePicture')
      .exec();
    return patients;
  }

  async findOne(id: string) {
    const patient = await this.patientModel
      .findById(id)
      .populate('userId', 'firstName lastName email phone profilePicture')
      .exec();

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async findByUserId(userId: string) {
    const patient = await this.patientModel
      .findOne({ userId })
      .populate('userId', 'firstName lastName email phone profilePicture')
      .exec();

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    const patient = await this.patientModel
      .findByIdAndUpdate(id, updatePatientDto, { new: true })
      .populate('userId', 'firstName lastName email phone profilePicture')
      .exec();

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async remove(id: string) {
    const patient = await this.patientModel.findByIdAndDelete(id).exec();

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return { message: 'Patient deleted successfully' };
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

    return patient.populate('userId', 'firstName lastName email phone');
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

    return patient.populate('userId', 'firstName lastName email phone');
  }

  async getPatientAppointments(patientId: string) {
    // This will be implemented when Appointments module is ready
    const patient = await this.findOne(patientId);
    return {
      patientId,
      totalAppointments: patient.totalAppointments || 0,
      completedAppointments: patient.completedAppointments || 0,
      cancelledAppointments: patient.cancelledAppointments || 0,
      noShowAppointments: patient.noShowAppointments || 0,
      message: 'Appointment details will be fetched from Appointments module',
    };
  }

  async getPatientMedicalRecords(patientId: string) {
    // This will be implemented when Medical Records module is ready
    const patient = await this.findOne(patientId);
    return {
      patientId,
      medicalRecordNumber: patient.medicalRecordNumber,
      allergies: patient.allergies || [],
      chronicConditions: patient.chronicConditions || [],
      bloodType: patient.bloodType,
      message: 'Full medical records will be fetched from Medical Records module',
    };
  }

  async getPatientWallet(patientId: string) {
    // This will be implemented when Wallet module is ready
    return {
      patientId,
      message: 'Wallet details will be fetched from Wallet module',
    };
  }

  async updateAppointmentStats(patientId: string, stats: any) {
    await this.patientModel.findByIdAndUpdate(patientId, stats);
  }

  private async generateMedicalRecordNumber(): Promise<string> {
    const prefix = 'MRN';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }
}

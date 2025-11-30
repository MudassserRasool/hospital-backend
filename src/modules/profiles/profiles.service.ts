import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from './entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {}

  /**
   * Create a profile for a user
   */
  async create(userId: string, createProfileDto: CreateProfileDto) {
    // Check if profile already exists
    const existing = await this.profileModel.findOne({ userId });
    if (existing) {
      throw new ConflictException('Profile already exists for this user');
    }

    // Generate medical record number for patients if not provided
    if (createProfileDto.role === 'patient' && !createProfileDto.medicalRecordNumber) {
      createProfileDto.medicalRecordNumber = await this.generateMedicalRecordNumber();
    }

    const profile = await this.profileModel.create({
      userId,
      ...createProfileDto,
      // Initialize appointment stats for patients
      ...(createProfileDto.role === 'patient' && {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        noShowAppointments: 0,
      }),
    });

    return profile.populate('userId', 'firstName lastName email phone profilePicture');
  }

  /**
   * Find profile by user ID
   */
  async findByUserId(userId: string) {
    const profile = await this.profileModel
      .findOne({ userId })
      .populate('userId', 'firstName lastName email phone profilePicture')
      .exec();

    return profile;
  }

  /**
   * Find profile by ID
   */
  async findOne(id: string) {
    const profile = await this.profileModel
      .findById(id)
      .populate('userId', 'firstName lastName email phone profilePicture')
      .exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  /**
   * Update profile by user ID
   */
  async updateByUserId(userId: string, updateProfileDto: UpdateProfileDto) {
    const profile = await this.profileModel
      .findOneAndUpdate({ userId }, updateProfileDto, { new: true })
      .populate('userId', 'firstName lastName email phone profilePicture')
      .exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  /**
   * Update profile by ID
   */
  async update(id: string, updateProfileDto: UpdateProfileDto) {
    const profile = await this.profileModel
      .findByIdAndUpdate(id, updateProfileDto, { new: true })
      .populate('userId', 'firstName lastName email phone profilePicture')
      .exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  /**
   * Delete profile by user ID
   */
  async removeByUserId(userId: string) {
    const profile = await this.profileModel.findOneAndDelete({ userId });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return { message: 'Profile deleted successfully' };
  }

  /**
   * Delete profile by ID
   */
  async remove(id: string) {
    const profile = await this.profileModel.findByIdAndDelete(id);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return { message: 'Profile deleted successfully' };
  }

  /**
   * Find all profiles with filters (for patients, doctors, etc.)
   */
  async findAll(filters?: any) {
    const query = filters || {};
    const profiles = await this.profileModel
      .find(query)
      .populate('userId', 'firstName lastName email phone profilePicture')
      .exec();
    return profiles;
  }

  /**
   * Find profile by phone number (for patients)
   */
  async findByPhone(phone: string) {
    const profile = await this.profileModel
      .findOne({ phone, role: 'patient' })
      .populate('userId', 'firstName lastName email phone profilePicture')
      .exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  /**
   * Update appointment statistics (for patients)
   */
  async updateAppointmentStats(userId: string, stats: {
    totalAppointments?: number;
    completedAppointments?: number;
    cancelledAppointments?: number;
    noShowAppointments?: number;
  }) {
    await this.profileModel.findOneAndUpdate({ userId }, stats);
  }

  /**
   * Get patient appointments info (placeholder for appointments module integration)
   */
  async getPatientAppointments(profileId: string) {
    const profile = await this.findOne(profileId);
    return {
      profileId,
      totalAppointments: profile.totalAppointments || 0,
      completedAppointments: profile.completedAppointments || 0,
      cancelledAppointments: profile.cancelledAppointments || 0,
      noShowAppointments: profile.noShowAppointments || 0,
      message: 'Appointment details will be fetched from Appointments module',
    };
  }

  /**
   * Get patient medical records info (placeholder for medical records module integration)
   */
  async getPatientMedicalRecords(profileId: string) {
    const profile = await this.findOne(profileId);
    return {
      profileId,
      medicalRecordNumber: profile.medicalRecordNumber,
      allergies: profile.allergies || [],
      chronicConditions: profile.chronicConditions || [],
      bloodType: profile.bloodType,
      message: 'Full medical records will be fetched from Medical Records module',
    };
  }

  /**
   * Get patient wallet info (placeholder for wallet module integration)
   */
  async getPatientWallet(profileId: string) {
    return {
      profileId,
      message: 'Wallet details will be fetched from Wallet module',
    };
  }

  /**
   * Generate medical record number for patients
   */
  private async generateMedicalRecordNumber(): Promise<string> {
    const prefix = 'MRN';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }
}


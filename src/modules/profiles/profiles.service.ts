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

    const profile = await this.profileModel.create({
      userId,
      ...createProfileDto,
    });

    return profile;
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
   * Block profile (for patients)
   */
  async blockProfile(userId: string, reason: string, blockedBy: string) {
    const profile = await this.profileModel.findOne({ userId });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    profile.isBlocked = true;
    profile.blockReason = reason;
    if (!profile.blockHistory) {
      profile.blockHistory = [];
    }
    profile.blockHistory.push({
      action: 'blocked',
      reason,
      by: blockedBy as any,
      date: new Date(),
    });

    await profile.save();

    return profile.populate('userId', 'firstName lastName email phone');
  }

  /**
   * Unblock profile (for patients)
   */
  async unblockProfile(userId: string, reason: string, unblockedBy: string) {
    const profile = await this.profileModel.findOne({ userId });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    profile.isBlocked = false;
    profile.blockReason = undefined;
    if (!profile.blockHistory) {
      profile.blockHistory = [];
    }
    profile.blockHistory.push({
      action: 'unblocked',
      reason,
      by: unblockedBy as any,
      date: new Date(),
    });

    await profile.save();

    return profile.populate('userId', 'firstName lastName email phone');
  }
}


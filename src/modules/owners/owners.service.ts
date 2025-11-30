import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Hospital,
  HospitalDocument,
} from '../hospitals/entities/hospital.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User, UserDocument } from '../users/entities/user.entity';
import { UpdateOwnerDto } from './dto/update-owner.dto';

@Injectable()
export class OwnersService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Get owner profile
   */
  async getOwnerProfile(userId: string) {
    const owner = await this.userModel
      .findById(userId)
      .select('-password -refreshTokens')
      .populate('hospitalId', 'name logo')
      .exec();

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    return owner;
  }

  /**
   * Update owner profile
   */
  async updateOwnerProfile(userId: string, updateData: UpdateOwnerDto) {
    const owner = await this.userModel
      .findByIdAndUpdate(userId, updateData, {
        new: true,
        select: '-password -refreshTokens',
      })
      .populate('hospitalId', 'name logo')
      .exec();

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    return owner;
  }

  /**
   * Get hospital details
   */
  async getHospital(hospitalId: string) {
    const hospital = await this.hospitalModel.findById(hospitalId).exec();

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return hospital;
  }

  /**
   * Update hospital profile
   */
  async updateHospital(hospitalId: string, updateData: any) {
    const hospital = await this.hospitalModel
      .findByIdAndUpdate(hospitalId, updateData, { new: true })
      .exec();

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return hospital;
  }

  /**
   * Get all staff for a hospital
   */
  async getStaffList(
    hospitalId: string,
    options?: {
      role?: string;
      isActive?: boolean;
      limit?: number;
      skip?: number;
    },
  ) {
    const query: any = {
      hospitalId,
      role: { $in: ['doctor', 'nurse', 'staff', 'receptionist'] },
    };

    if (options?.role) {
      query.role = options.role;
    }
    if (options?.isActive !== undefined) {
      query.isActive = options.isActive;
    }

    const staff = await this.userModel
      .find(query)
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0)
      .exec();

    const total = await this.userModel.countDocuments(query);

    return {
      staff,
      total,
    };
  }

  /**
   * Get staff details
   */

  // create staff
  async createUser(hospitalId: string, createUserDto: CreateUserDto) {
    const user = await this.userModel.create({
      ...createUserDto,
      hospitalId,
    });

    return user;
  }

  async getStaffDetails(staffId: string) {
    const staff = await this.userModel
      .findById(staffId)
      .select('-password -refreshTokens')
      .populate('hospitalId', 'name logo')
      .exec();

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff;
  }

  /**
   * Get hospital statistics
   */
  async getHospitalStats(hospitalId: string) {
    // Get total staff count
    const totalStaff = await this.userModel.countDocuments({
      hospitalId,
      role: { $in: ['doctor', 'nurse', 'staff', 'receptionist'] },
      isActive: true,
    });

    const totalDoctors = await this.userModel.countDocuments({
      hospitalId,
      role: 'doctor',
      isActive: true,
    });

    const totalNurses = await this.userModel.countDocuments({
      hospitalId,
      role: 'nurse',
      isActive: true,
    });

    // These would be fetched from respective models
    // For now, returning placeholder data
    return {
      staff: {
        total: totalStaff,
        doctors: totalDoctors,
        nurses: totalNurses,
        active: totalStaff,
      },
      appointments: {
        today: 0, // TODO: Implement
        thisWeek: 0,
        thisMonth: 0,
      },
      patients: {
        total: 0, // TODO: Implement
        new: 0,
      },
      revenue: {
        today: 0, // TODO: Implement
        thisWeek: 0,
        thisMonth: 0,
      },
    };
  }

  /**
   * Block/Unblock staff
   */
  async toggleStaffStatus(
    staffId: string,
    isBlocked: boolean,
    reason?: string,
  ) {
    const staff = await this.userModel.findById(staffId);

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    staff.isBlocked = isBlocked;
    if (isBlocked && reason) {
      staff.blockedReason = reason;
      staff.blockedAt = new Date();
    } else {
      staff.blockedReason = undefined;
      staff.blockedAt = undefined;
    }

    await staff.save();

    return staff;
  }

  /**
   * Activate/Deactivate staff
   */
  async toggleStaffActiveStatus(staffId: string, isActive: boolean) {
    const staff = await this.userModel.findByIdAndUpdate(
      staffId,
      { isActive },
      { new: true },
    );

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff;
  }
}

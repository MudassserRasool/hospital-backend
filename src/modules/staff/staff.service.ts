import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Get staff profile
   */
  async getStaffProfile(staffId: string) {
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
   * Update staff profile
   */
  async updateStaffProfile(staffId: string, updateData: any) {
    const staff = await this.userModel
      .findByIdAndUpdate(staffId, updateData, { new: true })
      .select('-password -refreshTokens')
      .populate('hospitalId', 'name logo')
      .exec();

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff;
  }

  /**
   * Get staff by hospital
   */
  async getStaffByHospital(hospitalId: string, options?: {
    role?: string;
    isActive?: boolean;
  }) {
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
      .exec();

    return staff;
  }

  /**
   * Get work hours for a staff member
   * This would integrate with attendance module
   */
  async getWorkHours(staffId: string, startDate: Date, endDate: Date) {
    // This will be implemented by calling attendance service
    return {
      staffId,
      startDate,
      endDate,
      totalHours: 0, // TODO: Calculate from attendance
      message: 'Work hours calculated from attendance module',
    };
  }

  /**
   * Get staff statistics
   */
  async getStaffStats(staffId: string) {
    const staff = await this.getStaffProfile(staffId);

    // These would be calculated from related modules
    return {
      staffId,
      role: staff.role,
      totalAppointments: 0, // TODO: From appointments
      completedAppointments: 0,
      totalWorkHours: 0, // TODO: From attendance
      leaveBalance: {}, // TODO: From leaves
    };
  }
}

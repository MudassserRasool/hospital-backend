import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProfilesService } from '../profiles/profiles.service';
import { User, UserDocument } from '../users/entities/user.entity';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private profilesService: ProfilesService,
  ) {}

  /**
   * Get staff profile (with profile data if exists)
   */
  async getStaffProfile(staffId: string): Promise<any> {
    const staff = await this.userModel
      .findById(staffId)
      .select('-password -refreshTokens')
      .populate('hospitalId', 'name logo')
      .exec();

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    const staffObj = staff.toObject ? staff.toObject() : staff;

    // Get profile data if exists
    try {
      const profile = await this.profilesService.findByUserId(staffId);
      if (profile) {
        const profileObj = profile.toObject ? profile.toObject() : profile;
        return {
          ...staffObj,
          ...profileObj,
          // Keep user fields that might be overridden
          email: staffObj.email,
          role: staffObj.role,
          hospitalId: staffObj.hospitalId,
        };
      }
    } catch (error) {
      // Profile doesn't exist, return just user data
    }

    return staffObj;
  }

  /**
   * Update staff profile
   */
  async updateStaffProfile(staffId: string, updateData: UpdateStaffDto): Promise<any> {
    const staff = await this.userModel
      .findById(staffId)
      .select('-password -refreshTokens')
      .exec();

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // Separate user fields from profile fields
    const userFields: any = {};
    const profileFields: any = {};

    // User fields
    if (updateData.firstName !== undefined) userFields.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) userFields.lastName = updateData.lastName;
    if (updateData.phone !== undefined) userFields.phone = updateData.phone;
    if (updateData.profilePicture !== undefined) userFields.profilePicture = updateData.profilePicture;

    // Profile fields
    if (updateData.dateOfBirth !== undefined) {
      profileFields.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.gender !== undefined) profileFields.gender = updateData.gender;
    if (updateData.specialization !== undefined) profileFields.specialization = updateData.specialization;
    if (updateData.licenseNumber !== undefined) profileFields.licenseNumber = updateData.licenseNumber;
    if (updateData.experience !== undefined) profileFields.experience = updateData.experience;
    if (updateData.timing !== undefined) {
      // Convert string array to Date array if needed
      profileFields.timing = Array.isArray(updateData.timing)
        ? updateData.timing.map((t) => (typeof t === 'string' ? new Date(t) : t))
        : updateData.timing;
    }

    // Update user if there are user fields
    if (Object.keys(userFields).length > 0) {
      await this.userModel.findByIdAndUpdate(staffId, userFields);
    }

    // Update or create profile if there are profile fields
    if (Object.keys(profileFields).length > 0) {
      try {
        await this.profilesService.updateByUserId(staffId, profileFields);
      } catch (error) {
        // Profile doesn't exist, create it
        if (error instanceof NotFoundException) {
          await this.profilesService.create(staffId, {
            role: staff.role,
            ...profileFields,
          });
        }
      }
    }

    // Return updated staff with profile
    return this.getStaffProfile(staffId);
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

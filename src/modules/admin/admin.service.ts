import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hospital, HospitalDocument } from '../hospitals/entities/hospital.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { ReceiptTemplate, ReceiptTemplateDocument } from '../receipt-templates/entities/receipt-template.entity';
import { Settings, SettingsDocument } from '../settings/entities/settings.entity';
import { AuditLog, AuditLogDocument } from '../audit-logs/entities/audit-log.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ReceiptTemplate.name) private receiptTemplateModel: Model<ReceiptTemplateDocument>,
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  // ========== HOSPITALS MANAGEMENT ==========

  async getHospitals(params?: any) {
    const query: any = {};
    
    if (params?.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { 'contact.email': { $regex: params.search, $options: 'i' } },
      ];
    }

    if (params?.isActive !== undefined) {
      query.isActive = params.isActive === 'true';
    }

    const hospitals = await this.hospitalModel
      .find(query)
      .populate('ownerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(params?.limit || 50)
      .skip(params?.skip || 0)
      .exec();

    const total = await this.hospitalModel.countDocuments(query);

    return { hospitals, total };
  }

  async createHospital(data: any, createdBy: string) {
    // Check if hospital with same name exists
    const existing = await this.hospitalModel.findOne({ name: data.name });
    if (existing) {
      throw new ConflictException('Hospital with this name already exists');
    }

    const hospital = await this.hospitalModel.create({
      ...data,
      isActive: true,
      createdBy,
    });

    // Log action
    await this.createAuditLog({
      action: 'CREATE_HOSPITAL',
      userId: createdBy,
      details: { hospitalId: hospital._id, hospitalName: hospital.name },
    });

    return hospital.populate('ownerId', 'firstName lastName email');
  }

  async getHospitalDetails(id: string) {
    const hospital = await this.hospitalModel
      .findById(id)
      .populate('ownerId', 'firstName lastName email phone')
      .exec();

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    // Get additional stats
    const totalStaff = await this.userModel.countDocuments({
      hospitalId: id,
      role: { $in: ['doctor', 'nurse', 'staff', 'receptionist'] },
    });

    return {
      ...hospital.toObject(),
      stats: {
        totalStaff,
      },
    };
  }

  async updateHospital(id: string, data: any) {
    const hospital = await this.hospitalModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate('ownerId', 'firstName lastName email')
      .exec();

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return hospital;
  }

  async deactivateHospital(id: string) {
    const hospital = await this.hospitalModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return { message: 'Hospital deactivated successfully', hospital };
  }

  async getHospitalAnalytics(id: string, params: any) {
    // Get hospital analytics
    // This would integrate with appointments, patients, payments modules
    return {
      hospitalId: id,
      totalAppointments: 0, // TODO: Calculate from Appointments
      totalPatients: 0, // TODO: Calculate from Patients
      totalRevenue: 0, // TODO: Calculate from Payments
      staffCount: 0, // TODO: Calculate from Users
    };
  }

  // ========== OWNERS MANAGEMENT ==========

  async getOwners(params?: any) {
    const query: any = { role: 'owner' };

    if (params?.search) {
      query.$or = [
        { firstName: { $regex: params.search, $options: 'i' } },
        { lastName: { $regex: params.search, $options: 'i' } },
        { email: { $regex: params.search, $options: 'i' } },
      ];
    }

    if (params?.isBlocked !== undefined) {
      query.isBlocked = params.isBlocked === 'true';
    }

    const owners = await this.userModel
      .find(query)
      .select('-password -refreshTokens')
      .populate('hospitalId', 'name logo')
      .sort({ createdAt: -1 })
      .limit(params?.limit || 50)
      .skip(params?.skip || 0)
      .exec();

    const total = await this.userModel.countDocuments(query);

    return { owners, total };
  }

  async createOwner(data: any, createdBy: string) {
    // Check if email exists
    const existing = await this.userModel.findOne({ email: data.email });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate random password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const owner = await this.userModel.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'owner',
      phone: data.phone,
      hospitalId: data.hospitalId,
      isActive: true,
      isBlocked: false,
    });

    // Log action
    await this.createAuditLog({
      action: 'CREATE_OWNER',
      userId: createdBy,
      details: { ownerId: owner._id, email: owner.email },
    });

    // Return owner with temporary password (send via email in production)
    return {
      owner: owner.toObject(),
      temporaryPassword: tempPassword,
      message: 'Owner created successfully. Please share the temporary password securely.',
    };
  }

  async getOwnerDetails(id: string) {
    const owner = await this.userModel
      .findById(id)
      .select('-password -refreshTokens')
      .populate('hospitalId')
      .exec();

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    return owner;
  }

  async updateOwner(id: string, data: any) {
    const owner = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-password -refreshTokens')
      .populate('hospitalId', 'name logo')
      .exec();

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    return owner;
  }

  async blockOwner(id: string, reason: string, blockedBy: string) {
    const owner = await this.userModel.findById(id);

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    owner.isBlocked = true;
    owner.blockedReason = reason;
    owner.blockedAt = new Date();
    owner.blockedBy = blockedBy as any;

    await owner.save();

    // Log action
    await this.createAuditLog({
      action: 'BLOCK_OWNER',
      userId: blockedBy,
      details: { ownerId: id, reason },
    });

    return owner;
  }

  async unblockOwner(id: string, unblockedBy: string) {
    const owner = await this.userModel.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
        blockedReason: undefined,
        blockedAt: undefined,
        blockedBy: undefined,
      },
      { new: true }
    );

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // Log action
    await this.createAuditLog({
      action: 'UNBLOCK_OWNER',
      userId: unblockedBy,
      details: { ownerId: id },
    });

    return owner;
  }

  async resetOwnerPassword(id: string) {
    const owner = await this.userModel.findById(id);

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // Generate new temporary password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    owner.password = hashedPassword;
    await owner.save();

    return {
      message: 'Password reset successfully',
      temporaryPassword: tempPassword,
    };
  }

  // ========== RECEIPT TEMPLATES ==========

  async getReceiptTemplate(hospitalId: string) {
    const template = await this.receiptTemplateModel
      .findOne({ hospitalId, isActive: true })
      .exec();

    return template;
  }

  async createReceiptTemplate(data: any) {
    const template = await this.receiptTemplateModel.create({
      ...data,
      isActive: true,
    });

    return template;
  }

  async updateReceiptTemplate(id: string, data: any) {
    const template = await this.receiptTemplateModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();

    if (!template) {
      throw new NotFoundException('Receipt template not found');
    }

    return template;
  }

  // ========== SYSTEM SETTINGS ==========

  async getSettings() {
    let settings = await this.settingsModel.findOne().exec();

    if (!settings) {
      // Create default settings
      settings = await this.settingsModel.create({
        systemName: 'Hospital Management System',
        systemEmail: 'admin@hospital.com',
        features: {
          enableGoogleOAuth: true,
          enablePayments: true,
          enableNotifications: true,
        },
        limits: {
          maxHospitals: 100,
          maxStaffPerHospital: 500,
        },
      });
    }

    return settings;
  }

  async updateSettings(data: any) {
    let settings = await this.settingsModel.findOne().exec();

    if (!settings) {
      settings = await this.settingsModel.create(data);
    } else {
      settings = await this.settingsModel
        .findByIdAndUpdate(settings._id, data, { new: true })
        .exec();
    }

    return settings;
  }

  // ========== AUDIT LOGS ==========

  async getAuditLogs(params?: any) {
    const query: any = {};

    if (params?.action) {
      query.action = params.action;
    }

    if (params?.userId) {
      query.userId = params.userId;
    }

    if (params?.startDate || params?.endDate) {
      query.createdAt = {};
      if (params.startDate) {
        query.createdAt.$gte = new Date(params.startDate);
      }
      if (params.endDate) {
        query.createdAt.$lte = new Date(params.endDate);
      }
    }

    const logs = await this.auditLogModel
      .find(query)
      .populate('userId', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(params?.limit || 100)
      .skip(params?.skip || 0)
      .exec();

    const total = await this.auditLogModel.countDocuments(query);

    return { logs, total };
  }

  private async createAuditLog(data: { action: string; userId: string; details?: any }) {
    await this.auditLogModel.create({
      action: data.action,
      userId: data.userId,
      metadata: data.details,
    });
  }

  // ========== SYSTEM STATISTICS ==========

  async getSystemStats() {
    const totalHospitals = await this.hospitalModel.countDocuments({ isActive: true });
    const totalOwners = await this.userModel.countDocuments({ role: 'owner', isActive: true });
    const totalDoctors = await this.userModel.countDocuments({ role: 'doctor', isActive: true });
    const totalPatients = await this.userModel.countDocuments({ role: 'patient' });

    return {
      hospitals: {
        total: totalHospitals,
        active: totalHospitals,
      },
      users: {
        owners: totalOwners,
        doctors: totalDoctors,
        patients: totalPatients,
      },
    };
  }

  // ========== HELPERS ==========

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const length = 12;
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}


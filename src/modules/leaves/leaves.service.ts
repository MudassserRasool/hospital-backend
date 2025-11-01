import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Leave, LeaveDocument } from './entities/leave.entity';

@Injectable()
export class LeavesService {
  constructor(
    @InjectModel(Leave.name) private leaveModel: Model<LeaveDocument>,
  ) {}

  /**
   * Request a leave
   */
  async requestLeave(
    staffId: string,
    hospitalId: string,
    startDate: Date,
    endDate: Date,
    reason: string,
    leaveType: string,
    attachments?: string[],
  ) {
    // Validate dates
    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for overlapping leave requests
    const overlapping = await this.leaveModel.findOne({
      staffId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
      ],
    });

    if (overlapping) {
      throw new BadRequestException(
        'You already have a leave request for this period',
      );
    }

    // Calculate total days
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

    // Create leave request
    const leave = await this.leaveModel.create({
      staffId,
      hospitalId,
      startDate,
      endDate,
      reason,
      leaveType,
      totalDays,
      attachments: attachments || [],
      status: 'pending',
    });

    return leave.populate([
      { path: 'staffId', select: 'firstName lastName email role' },
      { path: 'hospitalId', select: 'name' },
    ]);
  }

  /**
   * Get leave by ID
   */
  async findOne(id: string) {
    const leave = await this.leaveModel
      .findById(id)
      .populate([
        { path: 'staffId', select: 'firstName lastName email role' },
        { path: 'hospitalId', select: 'name' },
        { path: 'reviewedBy', select: 'firstName lastName' },
      ])
      .exec();

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    return leave;
  }

  /**
   * Get my leaves
   */
  async getMyLeaves(
    staffId: string,
    options?: {
      status?: string;
      limit?: number;
      skip?: number;
    },
  ) {
    const query: any = { staffId };

    if (options?.status) {
      query.status = options.status;
    }

    const leaves = await this.leaveModel
      .find(query)
      .populate([
        { path: 'hospitalId', select: 'name' },
        { path: 'reviewedBy', select: 'firstName lastName' },
      ])
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0)
      .exec();

    const total = await this.leaveModel.countDocuments(query);

    return {
      leaves,
      total,
    };
  }

  /**
   * Get pending leaves (for owner/admin)
   */
  async getPendingLeaves(
    hospitalId: string,
    options?: {
      limit?: number;
      skip?: number;
    },
  ) {
    const leaves = await this.leaveModel
      .find({
        hospitalId,
        status: 'pending',
      })
      .populate([
        { path: 'staffId', select: 'firstName lastName email role' },
        { path: 'hospitalId', select: 'name' },
      ])
      .sort({ createdAt: 1 }) // Oldest first
      .limit(options?.limit || 50)
      .skip(options?.skip || 0)
      .exec();

    const total = await this.leaveModel.countDocuments({
      hospitalId,
      status: 'pending',
    });

    return {
      leaves,
      total,
    };
  }

  /**
   * Get all leaves for a hospital
   */
  async getHospitalLeaves(
    hospitalId: string,
    options?: {
      status?: string;
      leaveType?: string;
      staffId?: string;
      limit?: number;
      skip?: number;
    },
  ) {
    const query: any = { hospitalId };

    if (options?.status) {
      query.status = options.status;
    }
    if (options?.leaveType) {
      query.leaveType = options.leaveType;
    }
    if (options?.staffId) {
      query.staffId = options.staffId;
    }

    const leaves = await this.leaveModel
      .find(query)
      .populate([
        { path: 'staffId', select: 'firstName lastName email role' },
        { path: 'reviewedBy', select: 'firstName lastName' },
      ])
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0)
      .exec();

    const total = await this.leaveModel.countDocuments(query);

    return {
      leaves,
      total,
    };
  }

  /**
   * Approve leave
   */
  async approveLeave(id: string, reviewerId: string, reviewerNotes?: string) {
    const leave = await this.findOne(id);

    if (leave.status !== 'pending') {
      throw new BadRequestException(`Cannot approve leave with status: ${leave.status}`);
    }

    leave.status = 'approved';
    leave.reviewedBy = reviewerId as any;
    leave.reviewedAt = new Date();
    leave.reviewerNotes = reviewerNotes;

    await leave.save();

    // TODO: Send notification to staff
    // await this.notificationService.sendLeaveApproved(leave);

    return leave.populate([
      { path: 'staffId', select: 'firstName lastName email' },
      { path: 'reviewedBy', select: 'firstName lastName' },
    ]);
  }

  /**
   * Reject leave
   */
  async rejectLeave(
    id: string,
    reviewerId: string,
    rejectionReason: string,
    reviewerNotes?: string,
  ) {
    const leave = await this.findOne(id);

    if (leave.status !== 'pending') {
      throw new BadRequestException(`Cannot reject leave with status: ${leave.status}`);
    }

    leave.status = 'rejected';
    leave.reviewedBy = reviewerId as any;
    leave.reviewedAt = new Date();
    leave.rejectionReason = rejectionReason;
    leave.reviewerNotes = reviewerNotes;

    await leave.save();

    // TODO: Send notification to staff
    // await this.notificationService.sendLeaveRejected(leave);

    return leave.populate([
      { path: 'staffId', select: 'firstName lastName email' },
      { path: 'reviewedBy', select: 'firstName lastName' },
    ]);
  }

  /**
   * Cancel leave request (by staff, only if pending)
   */
  async cancelLeave(id: string, staffId: string) {
    const leave = await this.findOne(id);

    // Verify ownership
    if (leave.staffId.toString() !== staffId) {
      throw new BadRequestException('You can only cancel your own leave requests');
    }

    if (leave.status !== 'pending') {
      throw new BadRequestException('Only pending leave requests can be cancelled');
    }

    await this.leaveModel.findByIdAndDelete(id);

    return { message: 'Leave request cancelled successfully' };
  }

  /**
   * Get leave balance (total days taken vs. allowed)
   */
  async getLeaveBalance(staffId: string, year?: number) {
    const currentYear = year || new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    // Get approved leaves for the year
    const approvedLeaves = await this.leaveModel.find({
      staffId,
      status: 'approved',
      startDate: { $gte: startOfYear, $lte: endOfYear },
    });

    // Calculate total days by leave type
    const leaveBalance = {
      sick: { taken: 0, allowed: 10 },
      casual: { taken: 0, allowed: 10 },
      annual: { taken: 0, allowed: 20 },
      emergency: { taken: 0, allowed: 5 },
      other: { taken: 0, allowed: 0 },
    };

    approvedLeaves.forEach((leave) => {
      const type = leave.leaveType as keyof typeof leaveBalance;
      if (leaveBalance[type]) {
        leaveBalance[type].taken += leave.totalDays;
      }
    });

    // Calculate remaining
    Object.keys(leaveBalance).forEach((type) => {
      const key = type as keyof typeof leaveBalance;
      leaveBalance[key]['remaining'] = leaveBalance[key].allowed - leaveBalance[key].taken;
    });

    return leaveBalance;
  }

  /**
   * Delete leave (admin only)
   */
  async remove(id: string) {
    const leave = await this.leaveModel.findByIdAndDelete(id);

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    return { message: 'Leave request deleted successfully' };
  }
}

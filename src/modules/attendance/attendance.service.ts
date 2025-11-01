import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
  ) {}

  async checkIn(staffId: string, hospitalId: string, wifiSSID?: string, gpsCoordinates?: any) {
    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = await this.attendanceModel.findOne({
      staffId,
      date: { $gte: today },
    });

    if (existing) {
      throw new BadRequestException('Already checked in today');
    }

    const attendance = await this.attendanceModel.create({
      staffId,
      hospitalId,
      date: new Date(),
      checkInTime: new Date(),
      locationVerified: !!wifiSSID || !!gpsCoordinates,
      wifiSSID,
      gpsCoordinates,
      status: 'present',
    });

    return attendance;
  }

  async checkOut(staffId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.attendanceModel.findOne({
      staffId,
      date: { $gte: today },
      checkOutTime: null,
    });

    if (!attendance) {
      throw new BadRequestException('No check-in found for today');
    }

    const checkOutTime = new Date();
    const workHours = (checkOutTime.getTime() - attendance.checkInTime.getTime()) / (1000 * 60 * 60);

    attendance.checkOutTime = checkOutTime;
    attendance.workHours = Math.round(workHours * 100) / 100;
    await attendance.save();

    return attendance;
  }

  async getAttendanceHistory(staffId: string, limit = 30) {
    return this.attendanceModel.find({ staffId }).sort({ date: -1 }).limit(limit).exec();
  }

  async getTodayAttendance(staffId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.attendanceModel.findOne({ staffId, date: { $gte: today } }).exec();
  }
}

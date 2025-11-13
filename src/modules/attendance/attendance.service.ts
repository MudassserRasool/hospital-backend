import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './entities/attendance.entity';

// Helper function to calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
  ) {}

  /**
   * Check-in staff with WiFi and GPS verification
   */
  async checkIn(
    staffId: string,
    hospitalId: string,
    wifiSSID: string,
    gpsCoordinates: { latitude: number; longitude: number },
  ) {
    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckIn = await this.attendanceModel.findOne({
      staffId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (existingCheckIn && !existingCheckIn.checkOutTime) {
      throw new BadRequestException('Already checked in today');
    }

    // Verify location (WiFi + GPS)
    const locationVerified = await this.verifyLocation(
      hospitalId,
      wifiSSID,
      gpsCoordinates,
    );

    if (!locationVerified.isValid) {
      throw new BadRequestException(
        `Location verification failed: ${locationVerified.reason}`,
      );
    }

    // Create attendance record
    const attendance = await this.attendanceModel.create({
      staffId,
      hospitalId,
      date: new Date(),
      checkInTime: new Date(),
      locationVerified: locationVerified.isValid,
      wifiSSID,
      gpsCoordinates,
      status: 'present',
    });

    return attendance.populate([
      { path: 'staffId', select: 'firstName lastName email' },
      { path: 'hospitalId', select: 'name' },
    ]);
  }

  /**
   * Check-out staff
   */
  async checkOut(staffId: string) {
    // Find today's attendance without checkout
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await this.attendanceModel.findOne({
      staffId,
      date: { $gte: today, $lt: tomorrow },
      checkOutTime: { $exists: false },
    });

    if (!attendance) {
      throw new NotFoundException('No active check-in found for today');
    }

    // Calculate work hours
    const checkOutTime = new Date();
    const workHours = (checkOutTime.getTime() - attendance.checkInTime.getTime()) / (1000 * 60 * 60);

    attendance.checkOutTime = checkOutTime;
    attendance.workHours = Math.round(workHours * 100) / 100; // Round to 2 decimal places

    // Determine status based on work hours
    if (workHours < 4) {
      attendance.status = 'half_day';
    }

    await attendance.save();

    return attendance.populate([
      { path: 'staffId', select: 'firstName lastName email' },
      { path: 'hospitalId', select: 'name' },
    ]);
  }

  /**
   * Get today's attendance for a staff member
   */
  async getTodayAttendance(staffId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await this.attendanceModel
      .findOne({
        staffId,
        date: { $gte: today, $lt: tomorrow },
      })
      .populate([
        { path: 'staffId', select: 'firstName lastName email' },
        { path: 'hospitalId', select: 'name' },
      ])
      .exec();

    return attendance;
  }

  /**
   * Get attendance history for a staff member
   */
  async getAttendanceHistory(
    staffId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    },
  ) {
    const query: any = { staffId };

    if (options?.startDate || options?.endDate) {
      query.date = {};
      if (options.startDate) {
        query.date.$gte = options.startDate;
      }
      if (options.endDate) {
        query.date.$lte = options.endDate;
      }
    }

    const attendance = await this.attendanceModel
      .find(query)
      .populate([
        { path: 'staffId', select: 'firstName lastName email' },
        { path: 'hospitalId', select: 'name' },
      ])
      .sort({ date: -1 })
      .limit(options?.limit || 30)
      .skip(options?.skip || 0)
      .exec();

    const total = await this.attendanceModel.countDocuments(query);

    return {
      attendance,
      total,
    };
  }

  /**
   * Get all attendance for a hospital (for owner/admin)
   */
  async getHospitalAttendance(
    hospitalId: string,
    options?: {
      date?: Date;
      status?: string;
      limit?: number;
      skip?: number;
    },
  ) {
    const query: any = { hospitalId };

    if (options?.date) {
      const startOfDay = new Date(options.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(options.date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (options?.status) {
      query.status = options.status;
    }

    const attendance = await this.attendanceModel
      .find(query)
      .populate([
        { path: 'staffId', select: 'firstName lastName email role' },
        { path: 'hospitalId', select: 'name' },
      ])
      .sort({ checkInTime: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0)
      .exec();

    const total = await this.attendanceModel.countDocuments(query);

    return {
      attendance,
      total,
    };
  }

  /**
   * Get work hours summary for a staff member
   */
  async getWorkHoursSummary(
    staffId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const attendance = await this.attendanceModel.find({
      staffId,
      date: { $gte: startDate, $lte: endDate },
      workHours: { $exists: true },
    });

    const totalHours = attendance.reduce((sum, record) => sum + (record.workHours || 0), 0);
    const totalDays = attendance.length;
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

    const presentDays = attendance.filter((r) => r.status === 'present').length;
    const halfDays = attendance.filter((r) => r.status === 'half_day').length;

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalDays,
      presentDays,
      halfDays,
      averageHours: Math.round(averageHours * 100) / 100,
    };
  }

  /**
   * Verify location using WiFi SSID and GPS coordinates
   */
  private async verifyLocation(
    hospitalId: string,
    wifiSSID: string,
    gpsCoordinates: { latitude: number; longitude: number },
  ): Promise<{ isValid: boolean; reason?: string }> {
    // TODO: Fetch hospital's WiFi SSID and GPS coordinates from database
    // For now, using mock data
    const hospitalWifiSSID = 'Hospital_WiFi'; // Should be fetched from hospital settings
    const hospitalGPS = {
      latitude: 31.5497,
      longitude: 74.3436,
    }; // Should be fetched from hospital settings

    // Verify WiFi SSID
    const wifiMatch = wifiSSID === hospitalWifiSSID;

    // Verify GPS coordinates (within 100 meters)
    const distance = calculateDistance(
      gpsCoordinates.latitude,
      gpsCoordinates.longitude,
      hospitalGPS.latitude,
      hospitalGPS.longitude,
    );

    const gpsValid = distance <= 100; // 100 meters tolerance

    if (!wifiMatch && !gpsValid) {
      return {
        isValid: false,
        reason: 'Neither WiFi nor GPS location matches hospital location',
      };
    }

    if (!wifiMatch) {
      return {
        isValid: false,
        reason: 'WiFi SSID does not match hospital WiFi',
      };
    }

    if (!gpsValid) {
      return {
        isValid: false,
        reason: `GPS location is ${Math.round(distance)} meters away from hospital (max 100m allowed)`,
      };
    }

    return { isValid: true };
  }

  /**
   * Manual attendance marking (by admin/owner)
   */
  async markAttendance(
    staffId: string,
    hospitalId: string,
    date: Date,
    status: 'present' | 'absent' | 'half_day' | 'leave',
    checkInTime?: Date,
    checkOutTime?: Date,
  ) {
    const attendance = await this.attendanceModel.create({
      staffId,
      hospitalId,
      date,
      checkInTime: checkInTime || date,
      checkOutTime,
      status,
      locationVerified: false, // Manual entry, no location verification
    });

    if (checkOutTime && checkInTime) {
      const workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      attendance.workHours = Math.round(workHours * 100) / 100;
      await attendance.save();
    }

    return attendance;
  }
}

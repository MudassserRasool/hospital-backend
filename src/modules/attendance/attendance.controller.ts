import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('checkin')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  @ApiOperation({ summary: 'Check-in with WiFi and GPS verification' })
  @ApiResponse({ status: 201, description: 'Checked in successfully' })
  @ApiResponse({ status: 400, description: 'Location verification failed or already checked in' })
  checkIn(
    @Body('wifiSSID') wifiSSID: string,
    @Body('gpsCoordinates') gpsCoordinates: { latitude: number; longitude: number },
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.checkIn(
      user.id,
      user.hospitalId,
      wifiSSID,
      gpsCoordinates,
    );
  }

  @Post('checkout')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  @ApiOperation({ summary: 'Check-out' })
  @ApiResponse({ status: 200, description: 'Checked out successfully' })
  @ApiResponse({ status: 404, description: 'No active check-in found' })
  checkOut(@CurrentUser() user: any) {
    return this.attendanceService.checkOut(user.id);
  }

  @Get('today')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  @ApiOperation({ summary: 'Get today\'s attendance' })
  @ApiResponse({ status: 200, description: 'Today\'s attendance retrieved successfully' })
  getTodayAttendance(@CurrentUser() user: any) {
    return this.attendanceService.getTodayAttendance(user.id);
  }

  @Get('me')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  @ApiOperation({ summary: 'Get my attendance history' })
  @ApiResponse({ status: 200, description: 'Attendance history retrieved successfully' })
  getMyAttendance(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.attendanceService.getAttendanceHistory(user.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Number(limit) : 30,
      skip: skip ? Number(skip) : 0,
    });
  }

  @Get('staff/:staffId')
  @Roles('owner', 'super_admin')
  @ApiOperation({ summary: 'Get attendance history for a staff member' })
  @ApiResponse({ status: 200, description: 'Attendance history retrieved successfully' })
  getStaffAttendance(
    @Param('staffId') staffId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.attendanceService.getAttendanceHistory(staffId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Number(limit) : 30,
      skip: skip ? Number(skip) : 0,
    });
  }

  @Get('hospital/:hospitalId')
  @Roles('owner', 'super_admin')
  @ApiOperation({ summary: 'Get all attendance for a hospital' })
  @ApiResponse({ status: 200, description: 'Hospital attendance retrieved successfully' })
  getHospitalAttendance(
    @Param('hospitalId') hospitalId: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.attendanceService.getHospitalAttendance(hospitalId, {
      date: date ? new Date(date) : undefined,
      status,
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
    });
  }

  @Get('work-hours/:staffId')
  @Roles('doctor', 'nurse', 'staff', 'receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Get work hours summary' })
  @ApiResponse({ status: 200, description: 'Work hours summary retrieved successfully' })
  getWorkHoursSummary(
    @Param('staffId') staffId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getWorkHoursSummary(
      staffId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('mark')
  @Roles('owner', 'super_admin')
  @ApiOperation({ summary: 'Manually mark attendance (admin only)' })
  @ApiResponse({ status: 201, description: 'Attendance marked successfully' })
  markAttendance(
    @Body('staffId') staffId: string,
    @Body('hospitalId') hospitalId: string,
    @Body('date') date: string,
    @Body('status') status: 'present' | 'absent' | 'half_day' | 'leave',
    @Body('checkInTime') checkInTime?: string,
    @Body('checkOutTime') checkOutTime?: string,
  ) {
    return this.attendanceService.markAttendance(
      staffId,
      hospitalId,
      new Date(date),
      status,
      checkInTime ? new Date(checkInTime) : undefined,
      checkOutTime ? new Date(checkOutTime) : undefined,
    );
  }
}

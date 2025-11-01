import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
  constructor(private readonly service: AttendanceService) {}

  @Post('checkin')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  checkIn(@CurrentUser() user: any, @Body() body: any) {
    return this.service.checkIn(user.id, user.hospitalId, body.wifiSSID, body.gpsCoordinates);
  }

  @Post('checkout')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  checkOut(@CurrentUser() user: any) {
    return this.service.checkOut(user.id);
  }

  @Get(':staffId')
  @Roles('owner', 'receptionist', 'super_admin')
  getHistory(@Param('staffId') staffId: string) {
    return this.service.getAttendanceHistory(staffId);
  }

  @Get(':staffId/today')
  getTodayAttendance(@Param('staffId') staffId: string) {
    return this.service.getTodayAttendance(staffId);
  }
}

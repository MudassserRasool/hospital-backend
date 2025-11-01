import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReceptionService } from './reception.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reception')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('receptionist', 'owner', 'super_admin')
@Controller('reception')
export class ReceptionController {
  constructor(private readonly receptionService: ReceptionService) {}

  // ========== APPOINTMENT MANAGEMENT ==========

  @Get('appointment-requests')
  @ApiOperation({ summary: 'Get pending appointment requests' })
  @ApiResponse({ status: 200, description: 'Requests retrieved successfully' })
  getAppointmentRequests(@CurrentUser() user: any) {
    return this.receptionService.getAppointmentRequests(user.hospitalId);
  }

  @Patch('appointments/:id/confirm')
  @ApiOperation({ summary: 'Confirm appointment' })
  @ApiResponse({ status: 200, description: 'Appointment confirmed successfully' })
  confirmAppointment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.receptionService.confirmAppointment(id, user.id);
  }

  @Patch('appointments/:id/reject')
  @ApiOperation({ summary: 'Reject appointment' })
  @ApiResponse({ status: 200, description: 'Appointment rejected successfully' })
  rejectAppointment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.receptionService.rejectAppointment(id, reason, user.id);
  }

  @Get('appointments/today')
  @ApiOperation({ summary: "Get today's appointments" })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  getTodayAppointments(@CurrentUser() user: any) {
    return this.receptionService.getTodayAppointments(user.hospitalId);
  }

  @Get('appointments/date/:date')
  @ApiOperation({ summary: 'Get appointments by date' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  getAppointmentsByDate(@Param('date') date: string, @CurrentUser() user: any) {
    return this.receptionService.getAppointmentsByDate(user.hospitalId, date);
  }

  // ========== PATIENT CHECK-IN ==========

  @Post('checkin')
  @ApiOperation({ summary: 'Check-in patient' })
  @ApiResponse({ status: 201, description: 'Patient checked in successfully' })
  checkInPatient(@Body() data: any, @CurrentUser() user: any) {
    return this.receptionService.checkInPatient(data, user.id);
  }

  @Put('checkin/:appointmentId/vitals')
  @ApiOperation({ summary: 'Record patient vitals' })
  @ApiResponse({ status: 200, description: 'Vitals recorded successfully' })
  recordVitals(
    @Param('appointmentId') appointmentId: string,
    @Body() vitals: any,
    @CurrentUser() user: any,
  ) {
    return this.receptionService.recordVitals(appointmentId, vitals, user.id);
  }

  @Post('checkin/:appointmentId/receipt')
  @ApiOperation({ summary: 'Generate receipt' })
  @ApiResponse({ status: 201, description: 'Receipt generated successfully' })
  generateReceipt(@Param('appointmentId') appointmentId: string) {
    return this.receptionService.generateReceipt(appointmentId);
  }

  // ========== PATIENT MANAGEMENT ==========

  @Get('patients')
  @ApiOperation({ summary: 'Get all patients' })
  @ApiResponse({ status: 200, description: 'Patients retrieved successfully' })
  getPatients(@Query() params: any, @CurrentUser() user: any) {
    return this.receptionService.getPatients(user.hospitalId, params);
  }

  @Get('patients/:id')
  @ApiOperation({ summary: 'Get patient details' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  getPatientDetails(@Param('id') id: string) {
    return this.receptionService.getPatientDetails(id);
  }

  @Post('patients')
  @ApiOperation({ summary: 'Create patient (walk-in)' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  createPatient(@Body() data: any, @CurrentUser() user: any) {
    return this.receptionService.createPatient(data, user.hospitalId);
  }

  @Put('patients/:id')
  @ApiOperation({ summary: 'Update patient' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  updatePatient(@Param('id') id: string, @Body() data: any) {
    return this.receptionService.updatePatient(id, data);
  }

  @Patch('patients/:id/block')
  @ApiOperation({ summary: 'Block patient' })
  @ApiResponse({ status: 200, description: 'Patient blocked successfully' })
  blockPatient(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.receptionService.blockPatient(id, reason, user.id);
  }

  @Patch('patients/:id/unblock')
  @ApiOperation({ summary: 'Unblock patient' })
  @ApiResponse({ status: 200, description: 'Patient unblocked successfully' })
  unblockPatient(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.receptionService.unblockPatient(id, reason, user.id);
  }

  @Get('patients/:id/history')
  @ApiOperation({ summary: 'Get patient medical history' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  getPatientHistory(@Param('id') id: string) {
    return this.receptionService.getPatientHistory(id);
  }

  // ========== DOCTOR MANAGEMENT ==========

  @Get('doctors')
  @ApiOperation({ summary: 'Get all doctors' })
  @ApiResponse({ status: 200, description: 'Doctors retrieved successfully' })
  getDoctors(@Query() params: any, @CurrentUser() user: any) {
    return this.receptionService.getDoctors(user.hospitalId, params);
  }

  @Post('doctors')
  @ApiOperation({ summary: 'Add doctor' })
  @ApiResponse({ status: 201, description: 'Doctor added successfully' })
  createDoctor(@Body() data: any, @CurrentUser() user: any) {
    return this.receptionService.createDoctor(data, user.hospitalId);
  }

  @Put('doctors/:id')
  @ApiOperation({ summary: 'Update doctor' })
  @ApiResponse({ status: 200, description: 'Doctor updated successfully' })
  updateDoctor(@Param('id') id: string, @Body() data: any) {
    return this.receptionService.updateDoctor(id, data);
  }

  @Patch('doctors/:id/block')
  @ApiOperation({ summary: 'Block doctor' })
  @ApiResponse({ status: 200, description: 'Doctor blocked successfully' })
  blockDoctor(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.receptionService.blockDoctor(id, reason, user.id);
  }

  @Put('doctors/:id/schedule')
  @ApiOperation({ summary: 'Update doctor schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  updateDoctorSchedule(@Param('id') id: string, @Body() schedule: any) {
    return this.receptionService.updateDoctorSchedule(id, schedule);
  }

  // ========== ANALYTICS ==========

  @Get('analytics/daily/:date')
  @ApiOperation({ summary: 'Get daily analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  getDailyAnalytics(@Param('date') date: string, @CurrentUser() user: any) {
    return this.receptionService.getDailyAnalytics(user.hospitalId, date);
  }

  @Get('analytics/monthly/:year/:month')
  @ApiOperation({ summary: 'Get monthly analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  getMonthlyAnalytics(
    @Param('year') year: string,
    @Param('month') month: string,
    @CurrentUser() user: any,
  ) {
    return this.receptionService.getMonthlyAnalytics(user.hospitalId, year, month);
  }

  @Get('analytics/patient-volume')
  @ApiOperation({ summary: 'Get patient volume trends' })
  @ApiResponse({ status: 200, description: 'Volume retrieved successfully' })
  getPatientVolume(@CurrentUser() user: any, @Query() params: any) {
    return this.receptionService.getPatientVolume(user.hospitalId, params);
  }
}


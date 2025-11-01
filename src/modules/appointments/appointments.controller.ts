import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('patient', 'receptionist')
  @ApiOperation({ summary: 'Book a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully' })
  @ApiResponse({ status: 409, description: 'Time slot conflict' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments (filtered by role)' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  findAll(@Query() filters: any, @CurrentUser() user: any) {
    // Apply role-based filtering
    if (user.role === 'patient') {
      filters.patientId = user.id;
    } else if (user.role === 'doctor') {
      filters.doctorId = user.id;
    } else if (user.role === 'receptionist' && user.hospitalId) {
      filters.hospitalId = user.hospitalId;
    }
    return this.appointmentsService.findAll(filters);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming appointments' })
  @ApiResponse({ status: 200, description: 'Upcoming appointments retrieved successfully' })
  getUpcoming(@CurrentUser() user: any) {
    return this.appointmentsService.getUpcomingAppointments(user.id, user.role);
  }

  @Get('patient/:patientId')
  @Roles('patient', 'doctor', 'receptionist', 'owner')
  @ApiOperation({ summary: 'Get appointments by patient' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  getByPatient(@Param('patientId') patientId: string) {
    return this.appointmentsService.getAppointmentsByPatient(patientId);
  }

  @Get('doctor/:doctorId')
  @Roles('doctor', 'receptionist', 'owner')
  @ApiOperation({ summary: 'Get appointments by doctor' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  getByDoctor(@Param('doctorId') doctorId: string, @Query('date') date?: Date) {
    return this.appointmentsService.getAppointmentsByDoctor(doctorId, date);
  }

  @Get('hospital/:hospitalId')
  @Roles('receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Get appointments by hospital' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  getByHospital(@Param('hospitalId') hospitalId: string, @Query() filters: any) {
    return this.appointmentsService.getAppointmentsByHospital(hospitalId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment details' })
  @ApiResponse({ status: 200, description: 'Appointment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('receptionist', 'doctor', 'owner')
  @ApiOperation({ summary: 'Update appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/confirm')
  @Roles('receptionist', 'owner')
  @ApiOperation({ summary: 'Confirm appointment' })
  @ApiResponse({ status: 200, description: 'Appointment confirmed successfully' })
  confirm(@Param('id') id: string) {
    return this.appointmentsService.confirmAppointment(id);
  }

  @Patch(':id/checkin')
  @Roles('receptionist', 'nurse')
  @ApiOperation({ summary: 'Check-in patient for appointment' })
  @ApiResponse({ status: 200, description: 'Patient checked in successfully' })
  checkIn(@Param('id') id: string, @CurrentUser() user: any) {
    return this.appointmentsService.checkIn(id, user.id);
  }

  @Patch(':id/vitals')
  @Roles('nurse', 'doctor', 'receptionist')
  @ApiOperation({ summary: 'Record patient vitals' })
  @ApiResponse({ status: 200, description: 'Vitals recorded successfully' })
  recordVitals(@Param('id') id: string, @Body() vitals: any, @CurrentUser() user: any) {
    return this.appointmentsService.recordVitals(id, vitals, user.id);
  }

  @Patch(':id/complete')
  @Roles('doctor')
  @ApiOperation({ summary: 'Complete appointment with diagnosis and prescription' })
  @ApiResponse({ status: 200, description: 'Appointment completed successfully' })
  complete(@Param('id') id: string, @Body() data: any) {
    return this.appointmentsService.completeAppointment(id, data);
  }

  @Patch(':id/cancel')
  @Roles('patient', 'receptionist', 'doctor', 'owner')
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  cancel(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.appointmentsService.cancelAppointment(id, reason, user.id);
  }

  @Patch(':id/no-show')
  @Roles('receptionist', 'owner')
  @ApiOperation({ summary: 'Mark appointment as no-show' })
  @ApiResponse({ status: 200, description: 'Appointment marked as no-show' })
  markNoShow(@Param('id') id: string) {
    return this.appointmentsService.markNoShow(id);
  }

  @Post(':id/reschedule')
  @Roles('patient', 'receptionist')
  @ApiOperation({ summary: 'Reschedule appointment' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled successfully' })
  reschedule(
    @Param('id') id: string,
    @Body('newDate') newDate: Date,
    @Body('newTimeSlot') newTimeSlot: any,
  ) {
    return this.appointmentsService.rescheduleAppointment(id, newDate, newTimeSlot);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete appointment' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}

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
  @Roles('patient')
  @ApiOperation({ summary: 'Book a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully' })
  @ApiResponse({ status: 409, description: 'Time slot not available' })
  create(@Body() createAppointmentDto: CreateAppointmentDto, @CurrentUser() user: any) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @Roles('patient', 'doctor', 'nurse', 'receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Get all appointments (filtered by role)' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  findAll(@Query() filters: any, @CurrentUser() user: any) {
    return this.appointmentsService.findAll(filters, user.id, user.role);
  }

  @Get('me')
  @Roles('patient')
  @ApiOperation({ summary: 'Get my appointments' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  getMyAppointments(@CurrentUser() user: any) {
    return this.appointmentsService.getPatientAppointments(user.patientId);
  }

  @Get('doctor/:doctorId/schedule')
  @Roles('patient', 'receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: "Get doctor's schedule for a date" })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  getDoctorSchedule(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getDoctorSchedule(doctorId, new Date(date));
  }

  @Get('appointment/:appointmentId')
  @Roles('patient', 'doctor', 'nurse', 'receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Get appointment by appointment ID' })
  @ApiResponse({ status: 200, description: 'Appointment retrieved successfully' })
  findByAppointmentId(@Param('appointmentId') appointmentId: string) {
    return this.appointmentsService.findByAppointmentId(appointmentId);
  }

  @Get(':id')
  @Roles('patient', 'doctor', 'nurse', 'receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Get appointment details' })
  @ApiResponse({ status: 200, description: 'Appointment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('patient', 'receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Update appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/confirm')
  @Roles('receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Confirm appointment (reception)' })
  @ApiResponse({ status: 200, description: 'Appointment confirmed successfully' })
  confirmAppointment(@Param('id') id: string) {
    return this.appointmentsService.confirmAppointment(id);
  }

  @Patch(':id/checkin')
  @Roles('receptionist', 'nurse', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Check-in patient (reception)' })
  @ApiResponse({ status: 200, description: 'Patient checked in successfully' })
  checkInPatient(
    @Param('id') id: string,
    @Body('vitals') vitals?: any,
  ) {
    return this.appointmentsService.checkInPatient(id, vitals);
  }

  @Patch(':id/complete')
  @Roles('doctor', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Complete appointment (doctor)' })
  @ApiResponse({ status: 200, description: 'Appointment completed successfully' })
  completeAppointment(
    @Param('id') id: string,
    @Body() completionData: {
      checkupNotes?: string;
      diagnosis?: string;
      prescriptions?: any[];
    },
  ) {
    return this.appointmentsService.completeAppointment(id, completionData);
  }

  @Patch(':id/cancel')
  @Roles('patient', 'receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  cancelAppointment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.cancelAppointment(id, reason, user.id);
  }

  @Post(':id/reschedule')
  @Roles('patient', 'receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Reschedule appointment' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled successfully' })
  rescheduleAppointment(
    @Param('id') id: string,
    @Body('date') date: string,
    @Body('timeSlot') timeSlot: { start: string; end: string },
  ) {
    return this.appointmentsService.rescheduleAppointment(
      id,
      new Date(date),
      {
        start: new Date(timeSlot.start),
        end: new Date(timeSlot.end),
      },
    );
  }

  @Patch(':id/no-show')
  @Roles('receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Mark appointment as no-show' })
  @ApiResponse({ status: 200, description: 'Appointment marked as no-show' })
  markNoShow(@Param('id') id: string) {
    return this.appointmentsService.markNoShow(id);
  }

  @Patch(':id/payment-status')
  @Roles('receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Update payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  updatePaymentStatus(
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: string,
    @Body('transactionId') transactionId?: string,
    @Body('walletCreditUsed') walletCreditUsed?: number,
  ) {
    return this.appointmentsService.updatePaymentStatus(
      id,
      paymentStatus,
      transactionId,
      walletCreditUsed,
    );
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete appointment' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}

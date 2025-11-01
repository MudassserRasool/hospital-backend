import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create patient profile (auto during Google OAuth)' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  @ApiResponse({ status: 409, description: 'Patient already exists' })
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @Roles('super_admin', 'owner', 'receptionist')
  @ApiOperation({ summary: 'Get all patients' })
  @ApiResponse({ status: 200, description: 'Patients retrieved successfully' })
  findAll(@Query() filters: any) {
    return this.patientsService.findAll(filters);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get patient by user ID' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  findByUserId(@Param('userId') userId: string) {
    return this.patientsService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient details' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Get(':id/appointments')
  @ApiOperation({ summary: 'Get patient appointments' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  getAppointments(@Param('id') id: string) {
    return this.patientsService.getPatientAppointments(id);
  }

  @Get(':id/medical-records')
  @Roles('doctor', 'nurse', 'receptionist', 'owner', 'patient')
  @ApiOperation({ summary: 'Get patient medical records' })
  @ApiResponse({ status: 200, description: 'Medical records retrieved successfully' })
  getMedicalRecords(@Param('id') id: string) {
    return this.patientsService.getPatientMedicalRecords(id);
  }

  @Get(':id/wallet')
  @Roles('patient', 'receptionist', 'owner')
  @ApiOperation({ summary: 'Get patient wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  getWallet(@Param('id') id: string) {
    return this.patientsService.getPatientWallet(id);
  }

  @Patch(':id')
  @Roles('patient', 'receptionist', 'owner')
  @ApiOperation({ summary: 'Update patient profile' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Patch(':id/block')
  @Roles('super_admin', 'owner', 'receptionist')
  @ApiOperation({ summary: 'Block patient with reason' })
  @ApiResponse({ status: 200, description: 'Patient blocked successfully' })
  blockPatient(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.patientsService.blockPatient(id, reason, user.id);
  }

  @Patch(':id/unblock')
  @Roles('super_admin', 'owner', 'receptionist')
  @ApiOperation({ summary: 'Unblock patient with reason' })
  @ApiResponse({ status: 200, description: 'Patient unblocked successfully' })
  unblockPatient(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.patientsService.unblockPatient(id, reason, user.id);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete patient' })
  @ApiResponse({ status: 200, description: 'Patient deleted successfully' })
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}

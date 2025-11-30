import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto as UpdateAuthDto } from '../auth/dto/update-auth.dto';
import { CreateProfileDto } from '../profiles/dto/create-profile.dto';
import { UpdateProfileDto } from '../profiles/dto/update-profile.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { UsersService } from '../users/users.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create patient profile (auto during Google OAuth)',
  })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  @ApiResponse({ status: 409, description: 'Patient already exists' })
  create(@Body() createPatientDto: CreatePatientDto) {
    // Convert CreatePatientDto to CreateProfileDto
    const createProfileDto: CreateProfileDto = {
      role: 'patient',
      dateOfBirth: createPatientDto.dateOfBirth
        ? new Date(createPatientDto.dateOfBirth).toISOString()
        : undefined,
      gender: createPatientDto.gender,
      bloodType: createPatientDto.bloodType,
      allergies: createPatientDto.allergies,
      chronicConditions: createPatientDto.chronicConditions,
      emergencyContact: createPatientDto.emergencyContact,
      medicalRecordNumber: createPatientDto.medicalRecordNumber,
      insuranceProvider: createPatientDto.insuranceProvider,
      insurancePolicyNumber: createPatientDto.insurancePolicyNumber,
      hospitalId: createPatientDto.hospitalId,
      phone: createPatientDto.phone,
    };
    return this.profilesService.create(
      createPatientDto.userId,
      createProfileDto,
    );
  }

  @Get('me')
  @Roles('patient')
  @ApiOperation({ summary: 'Get current patient profile' })
  @ApiResponse({
    status: 200,
    description: 'Patient profile retrieved successfully',
  })
  getMyProfile(@CurrentUser() user: any) {
    return this.profilesService.findByUserId(String(user.id));
  }

  @Patch('me')
  @Roles('patient')
  @ApiOperation({ summary: 'Update my patient profile' })
  @ApiResponse({
    status: 200,
    description: 'Patient profile updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    const userId = String(user.id);

    // Separate user fields (firstName, lastName, profilePicture) from profile fields
    const userUpdateDto: UpdateAuthDto = {};
    if (updatePatientDto.firstName !== undefined) {
      userUpdateDto.firstName = updatePatientDto.firstName;
    }
    if (updatePatientDto.lastName !== undefined) {
      userUpdateDto.lastName = updatePatientDto.lastName;
    }
    if (updatePatientDto.profilePicture !== undefined) {
      userUpdateDto.profilePicture = updatePatientDto.profilePicture;
    }

    // Update user fields if any
    if (Object.keys(userUpdateDto).length > 0) {
      await this.authService.updateProfile(userId, userUpdateDto);
    }

    // Convert UpdatePatientDto to UpdateProfileDto (profile fields only)
    const updateProfileDto: UpdateProfileDto = {
      dateOfBirth: updatePatientDto.dateOfBirth
        ? new Date(updatePatientDto.dateOfBirth).toISOString()
        : undefined,
      gender: updatePatientDto.gender,
      bloodType: updatePatientDto.bloodType,
      allergies: updatePatientDto.allergies,
      chronicConditions: updatePatientDto.chronicConditions,
      emergencyContact: updatePatientDto.emergencyContact,
      medicalRecordNumber: updatePatientDto.medicalRecordNumber,
      insuranceProvider: updatePatientDto.insuranceProvider,
      insurancePolicyNumber: updatePatientDto.insurancePolicyNumber,
      hospitalId: updatePatientDto.hospitalId,
      phone: updatePatientDto.phone,
    };

    // Update profile fields
    const profile = await this.profilesService.updateByUserId(
      userId,
      updateProfileDto,
    );

    // Get updated user data
    const updatedUser = await this.authService.getProfile(userId);

    // Return combined data
    const profileObj = profile.toObject ? profile.toObject() : profile;
    return {
      ...updatedUser,
      ...profileObj,
    };
  }

  // Get patient by phone number
  @Get('phone/:phone')
  @ApiOperation({ summary: 'Get patient by phone number' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  getPatientByPhone(@Param('phone') phone: string) {
    return this.profilesService.findByPhone(phone);
  }

  @Get()
  @Roles('super_admin', 'owner', 'receptionist')
  @ApiOperation({ summary: 'Get all patients' })
  @ApiResponse({ status: 200, description: 'Patients retrieved successfully' })
  findAll(@Query() filters: any) {
    // Add role filter to only get patients
    const query = { ...filters, role: 'patient' };
    return this.profilesService.findAll(query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get patient by user ID' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  findByUserId(@Param('userId') userId: string) {
    return this.profilesService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient details' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  findOne(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  @Get(':id/appointments')
  @ApiOperation({ summary: 'Get patient appointments' })
  @ApiResponse({
    status: 200,
    description: 'Appointments retrieved successfully',
  })
  getAppointments(@Param('id') id: string) {
    return this.profilesService.getPatientAppointments(id);
  }

  @Get(':id/medical-records')
  @Roles('doctor', 'nurse', 'receptionist', 'owner', 'patient')
  @ApiOperation({ summary: 'Get patient medical records' })
  @ApiResponse({
    status: 200,
    description: 'Medical records retrieved successfully',
  })
  getMedicalRecords(@Param('id') id: string) {
    return this.profilesService.getPatientMedicalRecords(id);
  }

  @Get(':id/wallet')
  @Roles('patient', 'receptionist', 'owner')
  @ApiOperation({ summary: 'Get patient wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  getWallet(@Param('id') id: string) {
    return this.profilesService.getPatientWallet(id);
  }

  @Patch(':id')
  @Roles('patient', 'receptionist', 'owner')
  @ApiOperation({ summary: 'Update patient profile' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    // Convert UpdatePatientDto to UpdateProfileDto
    const updateProfileDto: UpdateProfileDto = {
      dateOfBirth: updatePatientDto.dateOfBirth
        ? new Date(updatePatientDto.dateOfBirth).toISOString()
        : undefined,
      gender: updatePatientDto.gender,
      bloodType: updatePatientDto.bloodType,
      allergies: updatePatientDto.allergies,
      chronicConditions: updatePatientDto.chronicConditions,
      emergencyContact: updatePatientDto.emergencyContact,
      medicalRecordNumber: updatePatientDto.medicalRecordNumber,
      insuranceProvider: updatePatientDto.insuranceProvider,
      insurancePolicyNumber: updatePatientDto.insurancePolicyNumber,
      hospitalId: updatePatientDto.hospitalId,
      phone: updatePatientDto.phone,
    };
    return this.profilesService.update(id, updateProfileDto);
  }

  @Patch(':id/block')
  @Roles('super_admin', 'owner', 'receptionist')
  @ApiOperation({ summary: 'Block patient with reason' })
  @ApiResponse({ status: 200, description: 'Patient blocked successfully' })
  async blockPatient(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    // Get profile to find userId
    const profile = await this.profilesService.findOne(id);
    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }
    // Block the user (blocking is in users collection)
    return this.usersService.blockUser(
      String(profile.userId),
      reason,
      String(user.id),
    );
  }

  @Patch(':id/unblock')
  @Roles('super_admin', 'owner', 'receptionist')
  @ApiOperation({ summary: 'Unblock patient with reason' })
  @ApiResponse({ status: 200, description: 'Patient unblocked successfully' })
  async unblockPatient(
    @Param('id') id: string,
    @Body('reason') _reason: string,
    @CurrentUser() _user: any,
  ) {
    // Get profile to find userId
    const profile = await this.profilesService.findOne(id);
    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }
    // Unblock the user (blocking is in users collection)
    return this.usersService.unblockUser(String(profile.userId));
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete patient' })
  @ApiResponse({ status: 200, description: 'Patient deleted successfully' })
  remove(@Param('id') id: string) {
    return this.profilesService.remove(id);
  }
}

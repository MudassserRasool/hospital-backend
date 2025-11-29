import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Staff')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('me')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  @ApiOperation({ summary: 'Get my staff profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  getMyProfile(@CurrentUser() user: any): Promise<any> {
    return this.staffService.getStaffProfile(user.id);
  }

  @Patch('me')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateMyProfile(@CurrentUser() user: any, @Body() updateData: any): Promise<any> {
    return this.staffService.updateStaffProfile(user.id, updateData);
  }

  @Get('me/work-hours')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  @ApiOperation({ summary: 'Get my work hours' })
  @ApiResponse({ status: 200, description: 'Work hours retrieved successfully' })
  getMyWorkHours(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.staffService.getWorkHours(
      user.id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('me/stats')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  @ApiOperation({ summary: 'Get my statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getMyStats(@CurrentUser() user: any) {
    return this.staffService.getStaffStats(user.id);
  }

  @Get(':id')
  @Roles('owner', 'super_admin', 'receptionist')
  @ApiOperation({ summary: 'Get staff details' })
  @ApiResponse({ status: 200, description: 'Staff details retrieved successfully' })
  getStaffProfile(@Param('id') id: string): Promise<any> {
    return this.staffService.getStaffProfile(id);
  }

  @Get('hospital/:hospitalId')
  @Roles('owner', 'super_admin', 'receptionist')
  @ApiOperation({ summary: 'Get all staff in hospital' })
  @ApiResponse({ status: 200, description: 'Staff list retrieved successfully' })
  getStaffByHospital(
    @Param('hospitalId') hospitalId: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.staffService.getStaffByHospital(hospitalId, {
      role,
      isActive: isActive ? isActive === 'true' : undefined,
    });
  }

  @Get(':id/work-hours')
  @Roles('owner', 'super_admin')
  @ApiOperation({ summary: 'Get staff work hours' })
  @ApiResponse({ status: 200, description: 'Work hours retrieved successfully' })
  getStaffWorkHours(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.staffService.getWorkHours(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id/stats')
  @Roles('owner', 'super_admin')
  @ApiOperation({ summary: 'Get staff statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStaffStats(@Param('id') id: string) {
    return this.staffService.getStaffStats(id);
  }
}

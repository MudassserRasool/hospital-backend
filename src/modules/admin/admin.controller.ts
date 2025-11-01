import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';

@ApiTags('Super Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Hospitals Management
  @Get('hospitals')
  @ApiOperation({ summary: 'Get all hospitals' })
  @ApiResponse({ status: 200, description: 'Hospitals retrieved successfully' })
  getHospitals(@Query() params: any) {
    return this.adminService.getHospitals(params);
  }

  @Post('hospitals')
  @ApiOperation({ summary: 'Create new hospital' })
  @ApiResponse({ status: 201, description: 'Hospital created successfully' })
  createHospital(@Body() data: any, @CurrentUser() user: any) {
    return this.adminService.createHospital(data, user.id);
  }

  @Get('hospitals/:id')
  @ApiOperation({ summary: 'Get hospital details' })
  @ApiResponse({ status: 200, description: 'Hospital retrieved successfully' })
  getHospitalDetails(@Param('id') id: string) {
    return this.adminService.getHospitalDetails(id);
  }

  @Put('hospitals/:id')
  @ApiOperation({ summary: 'Update hospital' })
  @ApiResponse({ status: 200, description: 'Hospital updated successfully' })
  updateHospital(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateHospital(id, data);
  }

  @Delete('hospitals/:id')
  @ApiOperation({ summary: 'Deactivate hospital' })
  @ApiResponse({ status: 200, description: 'Hospital deactivated successfully' })
  deactivateHospital(@Param('id') id: string) {
    return this.adminService.deactivateHospital(id);
  }

  @Get('hospitals/:id/analytics')
  @ApiOperation({ summary: 'Get hospital analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  getHospitalAnalytics(@Param('id') id: string, @Query() params: any) {
    return this.adminService.getHospitalAnalytics(id, params);
  }

  // Owners Management
  @Get('owners')
  @ApiOperation({ summary: 'Get all owners' })
  @ApiResponse({ status: 200, description: 'Owners retrieved successfully' })
  getOwners(@Query() params: any) {
    return this.adminService.getOwners(params);
  }

  @Post('owners')
  @ApiOperation({ summary: 'Create owner with credentials' })
  @ApiResponse({ status: 201, description: 'Owner created successfully' })
  createOwner(@Body() data: any, @CurrentUser() user: any) {
    return this.adminService.createOwner(data, user.id);
  }

  @Get('owners/:id')
  @ApiOperation({ summary: 'Get owner details' })
  @ApiResponse({ status: 200, description: 'Owner retrieved successfully' })
  getOwnerDetails(@Param('id') id: string) {
    return this.adminService.getOwnerDetails(id);
  }

  @Put('owners/:id')
  @ApiOperation({ summary: 'Update owner' })
  @ApiResponse({ status: 200, description: 'Owner updated successfully' })
  updateOwner(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateOwner(id, data);
  }

  @Patch('owners/:id/block')
  @ApiOperation({ summary: 'Block owner' })
  @ApiResponse({ status: 200, description: 'Owner blocked successfully' })
  blockOwner(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.adminService.blockOwner(id, reason, user.id);
  }

  @Patch('owners/:id/unblock')
  @ApiOperation({ summary: 'Unblock owner' })
  @ApiResponse({ status: 200, description: 'Owner unblocked successfully' })
  unblockOwner(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.unblockOwner(id, user.id);
  }

  @Post('owners/:id/reset-password')
  @ApiOperation({ summary: 'Reset owner password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  resetOwnerPassword(@Param('id') id: string) {
    return this.adminService.resetOwnerPassword(id);
  }

  // Receipt Templates
  @Get('receipt-templates/:hospitalId')
  @ApiOperation({ summary: 'Get hospital receipt template' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  getReceiptTemplate(@Param('hospitalId') hospitalId: string) {
    return this.adminService.getReceiptTemplate(hospitalId);
  }

  @Post('receipt-templates')
  @ApiOperation({ summary: 'Create receipt template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  createReceiptTemplate(@Body() data: any) {
    return this.adminService.createReceiptTemplate(data);
  }

  @Put('receipt-templates/:id')
  @ApiOperation({ summary: 'Update receipt template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  updateReceiptTemplate(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateReceiptTemplate(id, data);
  }

  // System Settings
  @Get('settings')
  @ApiOperation({ summary: 'Get system settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update system settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  updateSettings(@Body() data: any) {
    return this.adminService.updateSettings(data);
  }

  // Audit Logs
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  getAuditLogs(@Query() params: any) {
    return this.adminService.getAuditLogs(params);
  }

  // Statistics
  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getSystemStats() {
    return this.adminService.getSystemStats();
  }
}


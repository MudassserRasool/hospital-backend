import { Controller, Get, Put, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OwnersService } from './owners.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Owners')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner')
@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get owner profile' })
  @ApiResponse({ status: 200, description: 'Owner profile retrieved successfully' })
  getOwnerProfile(@CurrentUser() user: any) {
    return this.ownersService.getOwnerProfile(user.id);
  }

  @Get('hospital')
  @ApiOperation({ summary: 'Get hospital details' })
  @ApiResponse({ status: 200, description: 'Hospital details retrieved successfully' })
  getHospital(@CurrentUser() user: any) {
    return this.ownersService.getHospital(user.hospitalId);
  }

  @Put('hospital')
  @ApiOperation({ summary: 'Update hospital profile' })
  @ApiResponse({ status: 200, description: 'Hospital updated successfully' })
  updateHospital(@CurrentUser() user: any, @Body() updateData: any) {
    return this.ownersService.updateHospital(user.hospitalId, updateData);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Get all staff members' })
  @ApiResponse({ status: 200, description: 'Staff list retrieved successfully' })
  getStaffList(
    @CurrentUser() user: any,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.ownersService.getStaffList(user.hospitalId, {
      role,
      isActive: isActive ? isActive === 'true' : undefined,
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
    });
  }

  @Get('staff/:staffId')
  @ApiOperation({ summary: 'Get staff details' })
  @ApiResponse({ status: 200, description: 'Staff details retrieved successfully' })
  getStaffDetails(@Param('staffId') staffId: string) {
    return this.ownersService.getStaffDetails(staffId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get hospital statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getHospitalStats(@CurrentUser() user: any) {
    return this.ownersService.getHospitalStats(user.hospitalId);
  }

  @Patch('staff/:staffId/block')
  @ApiOperation({ summary: 'Block staff member' })
  @ApiResponse({ status: 200, description: 'Staff blocked successfully' })
  blockStaff(
    @Param('staffId') staffId: string,
    @Body('reason') reason: string,
  ) {
    return this.ownersService.toggleStaffStatus(staffId, true, reason);
  }

  @Patch('staff/:staffId/unblock')
  @ApiOperation({ summary: 'Unblock staff member' })
  @ApiResponse({ status: 200, description: 'Staff unblocked successfully' })
  unblockStaff(@Param('staffId') staffId: string) {
    return this.ownersService.toggleStaffStatus(staffId, false);
  }

  @Patch('staff/:staffId/activate')
  @ApiOperation({ summary: 'Activate staff member' })
  @ApiResponse({ status: 200, description: 'Staff activated successfully' })
  activateStaff(@Param('staffId') staffId: string) {
    return this.ownersService.toggleStaffActiveStatus(staffId, true);
  }

  @Patch('staff/:staffId/deactivate')
  @ApiOperation({ summary: 'Deactivate staff member' })
  @ApiResponse({ status: 200, description: 'Staff deactivated successfully' })
  deactivateStaff(@Param('staffId') staffId: string) {
    return this.ownersService.toggleStaffActiveStatus(staffId, false);
  }
}

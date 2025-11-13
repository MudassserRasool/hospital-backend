import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Leaves')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  @ApiOperation({ summary: 'Request a leave' })
  @ApiResponse({ status: 201, description: 'Leave requested successfully' })
  @ApiResponse({ status: 400, description: 'Invalid dates or overlapping leave' })
  requestLeave(
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Body('reason') reason: string,
    @Body('leaveType') leaveType: string,
    @Body('attachments') attachments: string[],
    @CurrentUser() user: any,
  ) {
    return this.leavesService.requestLeave(
      user.id,
      user.hospitalId,
      new Date(startDate),
      new Date(endDate),
      reason,
      leaveType,
      attachments,
    );
  }

  @Get('me')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  @ApiOperation({ summary: 'Get my leave requests' })
  @ApiResponse({ status: 200, description: 'Leave requests retrieved successfully' })
  getMyLeaves(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.leavesService.getMyLeaves(user.id, {
      status,
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
    });
  }

  @Get('me/balance')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  @ApiOperation({ summary: 'Get my leave balance' })
  @ApiResponse({ status: 200, description: 'Leave balance retrieved successfully' })
  getMyLeaveBalance(
    @CurrentUser() user: any,
    @Query('year') year?: number,
  ) {
    return this.leavesService.getLeaveBalance(
      user.id,
      year ? Number(year) : undefined,
    );
  }

  @Get('pending')
  @Roles('owner', 'super_admin')
  @ApiOperation({ summary: 'Get pending leave requests' })
  @ApiResponse({ status: 200, description: 'Pending leaves retrieved successfully' })
  getPendingLeaves(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.leavesService.getPendingLeaves(user.hospitalId, {
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
    });
  }

  @Get('hospital/:hospitalId')
  @Roles('owner', 'super_admin')
  @ApiOperation({ summary: 'Get all leaves for a hospital' })
  @ApiResponse({ status: 200, description: 'Hospital leaves retrieved successfully' })
  getHospitalLeaves(
    @Param('hospitalId') hospitalId: string,
    @Query('status') status?: string,
    @Query('leaveType') leaveType?: string,
    @Query('staffId') staffId?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.leavesService.getHospitalLeaves(hospitalId, {
      status,
      leaveType,
      staffId,
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
    });
  }

  @Get(':id')
  @Roles('doctor', 'nurse', 'staff', 'receptionist', 'owner', 'super_admin')
  @ApiOperation({ summary: 'Get leave details' })
  @ApiResponse({ status: 200, description: 'Leave retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.leavesService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles('owner', 'super_admin')
  @ApiOperation({ summary: 'Approve leave request' })
  @ApiResponse({ status: 200, description: 'Leave approved successfully' })
  approveLeave(
    @Param('id') id: string,
    @Body('reviewerNotes') reviewerNotes: string,
    @CurrentUser() user: any,
  ) {
    return this.leavesService.approveLeave(id, user.id, reviewerNotes);
  }

  @Patch(':id/reject')
  @Roles('owner', 'super_admin')
  @ApiOperation({ summary: 'Reject leave request' })
  @ApiResponse({ status: 200, description: 'Leave rejected successfully' })
  rejectLeave(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('reviewerNotes') reviewerNotes: string,
    @CurrentUser() user: any,
  ) {
    return this.leavesService.rejectLeave(id, user.id, reason, reviewerNotes);
  }

  @Delete(':id/cancel')
  @Roles('doctor', 'nurse', 'staff', 'receptionist')
  @ApiOperation({ summary: 'Cancel leave request (only if pending)' })
  @ApiResponse({ status: 200, description: 'Leave cancelled successfully' })
  cancelLeave(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leavesService.cancelLeave(id, user.id);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete leave request (admin only)' })
  @ApiResponse({ status: 200, description: 'Leave deleted successfully' })
  remove(@Param('id') id: string) {
    return this.leavesService.remove(id);
  }
}

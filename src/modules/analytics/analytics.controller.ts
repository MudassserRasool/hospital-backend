import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard/:hospitalId')
  @Roles('super_admin', 'owner')
  getDashboard(@Param('hospitalId') hospitalId: string) {
    return this.service.getDashboardStats(hospitalId);
  }

  @Get('appointments/:hospitalId')
  @Roles('super_admin', 'owner')
  getAppointments(
    @Param('hospitalId') hospitalId: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.service.getAppointmentAnalytics(hospitalId, startDate, endDate);
  }

  @Get('revenue/:hospitalId')
  @Roles('super_admin', 'owner')
  getRevenue(
    @Param('hospitalId') hospitalId: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.service.getRevenueAnalytics(hospitalId, startDate, endDate);
  }
}

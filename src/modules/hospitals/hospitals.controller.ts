import {
  Body,
  Controller,
  Delete,
  Get,
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
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { HospitalsService } from './hospitals.service';

@ApiTags('Hospitals')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new hospital (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Hospital created successfully' })
  @ApiResponse({ status: 409, description: 'Hospital already exists' })
  create(@Body() createHospitalDto: CreateHospitalDto) {
    return this.hospitalsService.create(createHospitalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all hospitals' })
  @ApiResponse({ status: 200, description: 'Hospitals retrieved successfully' })
  findAll(@Query() filters: any) {
    return this.hospitalsService.findAll(filters);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search hospitals by name, city, specialty' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  search(@Query('q') searchTerm: string) {
    return this.hospitalsService.searchHospitals(searchTerm);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby hospitals' })
  @ApiResponse({
    status: 200,
    description: 'Nearby hospitals retrieved successfully',
  })
  getNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('maxDistance') maxDistance?: number,
  ) {
    return this.hospitalsService.getNearbyHospitals(
      latitude,
      longitude,
      maxDistance,
    );
  }

  @Get('owner/:ownerId')
  @Roles('super_admin', 'owner')
  @ApiOperation({ summary: 'Get hospitals by owner' })
  @ApiResponse({ status: 200, description: 'Hospitals retrieved successfully' })
  getByOwner(@Param('ownerId') ownerId: string) {
    return this.hospitalsService.findByOwner(ownerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hospital details' })
  @ApiResponse({ status: 200, description: 'Hospital retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  findOne(@Param('id') id: string) {
    return this.hospitalsService.findOne(id);
  }

  @Get(':id/staff')
  @Roles('super_admin', 'owner', 'receptionist')
  @ApiOperation({ summary: 'Get hospital staff' })
  @ApiResponse({ status: 200, description: 'Staff retrieved successfully' })
  getStaff(@Param('id') id: string) {
    return this.hospitalsService.getHospitalStaff(id);
  }

  @Get(':id/analytics')
  @Roles('super_admin', 'owner')
  @ApiOperation({ summary: 'Get hospital analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  getAnalytics(@Param('id') id: string) {
    return this.hospitalsService.getHospitalAnalytics(id);
  }

  @Patch(':id')
  @Roles('super_admin', 'owner')
  @ApiOperation({ summary: 'Update hospital' })
  @ApiResponse({ status: 200, description: 'Hospital updated successfully' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  update(
    @Param('id') id: string,
    @Body() updateHospitalDto: UpdateHospitalDto,
  ) {
    return this.hospitalsService.update(id, updateHospitalDto);
  }

  @Delete(':id/deactivate')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Deactivate hospital' })
  @ApiResponse({
    status: 200,
    description: 'Hospital deactivated successfully',
  })
  deactivate(@Param('id') id: string) {
    return this.hospitalsService.deactivate(id);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete hospital' })
  @ApiResponse({ status: 200, description: 'Hospital deleted successfully' })
  remove(@Param('id') id: string) {
    return this.hospitalsService.remove(id);
  }

  // get hospital mobile package id
  // avoid any type of auth here packageId is only the security measure
  @Get('mobile-package-id/:id')
  @ApiOperation({ summary: 'Get hospital mobile package id' })
  @ApiResponse({
    status: 200,
    description: 'Hospital mobile package id retrieved successfully',
  })
  getMobilePackageId(@Param('id') id: string) {
    return this.hospitalsService.getMobilePackageId(id);
  }
}

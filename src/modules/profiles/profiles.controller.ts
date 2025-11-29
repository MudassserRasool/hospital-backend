import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('Profiles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create profile' })
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  create(@CurrentUser() user: any, @Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(user.id, createProfileDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  getMyProfile(@CurrentUser() user: any) {
    return this.profilesService.findByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get profile by ID' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  findOne(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.updateByUserId(user.id, updateProfileDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update profile by ID' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.update(id, updateProfileDto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete my profile' })
  @ApiResponse({ status: 200, description: 'Profile deleted successfully' })
  removeMyProfile(@CurrentUser() user: any) {
    return this.profilesService.removeByUserId(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete profile by ID' })
  @ApiResponse({ status: 200, description: 'Profile deleted successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  remove(@Param('id') id: string) {
    return this.profilesService.remove(id);
  }
}

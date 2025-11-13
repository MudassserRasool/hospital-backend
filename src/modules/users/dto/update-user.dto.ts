import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isBlocked?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  blockedReason?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  profilePicture?: string;
}

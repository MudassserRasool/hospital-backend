import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from '../../users/dto/create-user.dto';

export class CreateOwnerDto extends CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  @IsOptional()
  declare hospitalId?: string;
}

export class UpdateOwnerDto extends CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  @IsOptional()
  declare hospitalId?: string;
}

// receptionist
export class CreateReceptionistDto extends CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  @IsOptional()
  declare hospitalId?: string;
}

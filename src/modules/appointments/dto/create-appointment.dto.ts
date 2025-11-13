import { IsString, IsNotEmpty, IsDate, IsNumber, IsOptional, ValidateNested, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class TimeSlotDto {
  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  start: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  end: Date;
}

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  hospitalId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ type: TimeSlotDto })
  @ValidateNested()
  @Type(() => TimeSlotDto)
  @IsNotEmpty()
  timeSlot: TimeSlotDto;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  paymentAmount: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  walletCreditUsed?: number;

  @ApiProperty({ enum: ['consultation', 'follow_up', 'emergency', 'checkup'], required: false })
  @IsEnum(['consultation', 'follow_up', 'emergency', 'checkup'])
  @IsOptional()
  appointmentType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  previousAppointmentId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;
}

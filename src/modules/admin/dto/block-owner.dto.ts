import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlockOwnerDto {
  @ApiProperty({ example: 'Violation of terms of service' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}


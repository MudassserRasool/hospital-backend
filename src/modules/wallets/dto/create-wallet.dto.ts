import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWalletDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  patientId: string;
}

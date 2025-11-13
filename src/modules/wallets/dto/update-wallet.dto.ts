import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateWalletDto } from './create-wallet.dto';

export { CreateWalletDto };
export class UpdateWalletDto extends PartialType(CreateWalletDto) {}

export class AddCreditDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  relatedAppointmentId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  relatedPaymentId?: string;
}

export class DebitCreditDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  relatedAppointmentId?: string;
}

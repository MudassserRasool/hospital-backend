import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ enum: ['easypaisa', 'wallet', 'mixed'] })
  @IsEnum(['easypaisa', 'wallet', 'mixed'])
  @IsNotEmpty()
  method: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  walletAmountUsed?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  easyPaisaAmountPaid?: number;
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  easyPaisaTransactionId?: string;
}

export class RefundPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  amount?: number; // If partial refund
}

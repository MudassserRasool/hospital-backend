import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class OtpDTO {
  @ApiProperty({ example: '+923612563896', required: false })
  @ValidateIf((o: OtpDTO) => !o.email)
  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Either phone or email must be provided' })
  phone?: string;

  @ApiProperty({ example: '1234' })
  @IsNotEmpty({ message: 'OTP is required' })
  @MinLength(4)
  otp: string | number;

  @ApiProperty({ example: 'example@gmail.com', required: false })
  @ValidateIf((o: OtpDTO) => !o.phone)
  @IsEmail()
  @IsNotEmpty({ message: 'Either phone or email must be provided' })
  email?: string;
}

import { IsString, IsNotEmpty, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReceiptTemplateDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  hospitalId: string;

  @ApiProperty({ example: 'Default Receipt Template' })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({ 
    example: {
      header: 'Hospital Name',
      footer: 'Thank you for your visit',
      logo: 'https://example.com/logo.png'
    },
    description: 'Template content object'
  })
  @IsObject()
  @IsNotEmpty()
  templateContent: any;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

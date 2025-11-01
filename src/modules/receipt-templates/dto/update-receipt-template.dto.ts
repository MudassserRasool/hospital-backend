import { PartialType } from '@nestjs/mapped-types';
import { CreateReceiptTemplateDto } from './create-receipt-template.dto';

export class UpdateReceiptTemplateDto extends PartialType(CreateReceiptTemplateDto) {}

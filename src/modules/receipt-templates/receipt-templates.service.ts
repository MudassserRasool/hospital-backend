import { Injectable } from '@nestjs/common';
import { CreateReceiptTemplateDto } from './dto/create-receipt-template.dto';
import { UpdateReceiptTemplateDto } from './dto/update-receipt-template.dto';

@Injectable()
export class ReceiptTemplatesService {
  create(createReceiptTemplateDto: CreateReceiptTemplateDto) {
    return 'This action adds a new receiptTemplate';
  }

  findAll() {
    return `This action returns all receiptTemplates`;
  }

  findOne(id: number) {
    return `This action returns a #${id} receiptTemplate`;
  }

  update(id: number, updateReceiptTemplateDto: UpdateReceiptTemplateDto) {
    return `This action updates a #${id} receiptTemplate`;
  }

  remove(id: number) {
    return `This action removes a #${id} receiptTemplate`;
  }
}

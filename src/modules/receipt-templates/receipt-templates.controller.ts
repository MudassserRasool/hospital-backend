import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReceiptTemplatesService } from './receipt-templates.service';
import { CreateReceiptTemplateDto } from './dto/create-receipt-template.dto';
import { UpdateReceiptTemplateDto } from './dto/update-receipt-template.dto';

@Controller('receipt-templates')
export class ReceiptTemplatesController {
  constructor(private readonly receiptTemplatesService: ReceiptTemplatesService) {}

  @Post()
  create(@Body() createReceiptTemplateDto: CreateReceiptTemplateDto) {
    return this.receiptTemplatesService.create(createReceiptTemplateDto);
  }

  @Get()
  findAll() {
    return this.receiptTemplatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.receiptTemplatesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReceiptTemplateDto: UpdateReceiptTemplateDto) {
    return this.receiptTemplatesService.update(+id, updateReceiptTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.receiptTemplatesService.remove(+id);
  }
}

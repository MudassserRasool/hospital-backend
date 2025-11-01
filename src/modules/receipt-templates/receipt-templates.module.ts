import { Module } from '@nestjs/common';
import { ReceiptTemplatesService } from './receipt-templates.service';
import { ReceiptTemplatesController } from './receipt-templates.controller';

@Module({
  controllers: [ReceiptTemplatesController],
  providers: [ReceiptTemplatesService],
})
export class ReceiptTemplatesModule {}

import { Module } from '@nestjs/common';
import { WorkHoursService } from './work-hours.service';
import { WorkHoursController } from './work-hours.controller';

@Module({
  controllers: [WorkHoursController],
  providers: [WorkHoursService],
})
export class WorkHoursModule {}

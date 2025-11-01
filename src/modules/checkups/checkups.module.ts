import { Module } from '@nestjs/common';
import { CheckupsService } from './checkups.service';
import { CheckupsController } from './checkups.controller';

@Module({
  controllers: [CheckupsController],
  providers: [CheckupsService],
})
export class CheckupsModule {}

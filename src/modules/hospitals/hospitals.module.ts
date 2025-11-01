import { Module } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { HospitalsController } from './hospitals.controller';

@Module({
  controllers: [HospitalsController],
  providers: [HospitalsService],
})
export class HospitalsModule {}

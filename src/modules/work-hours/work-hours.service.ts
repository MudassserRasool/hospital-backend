import { Injectable } from '@nestjs/common';
import { CreateWorkHourDto } from './dto/create-work-hour.dto';
import { UpdateWorkHourDto } from './dto/update-work-hour.dto';

@Injectable()
export class WorkHoursService {
  create(createWorkHourDto: CreateWorkHourDto) {
    return 'This action adds a new workHour';
  }

  findAll() {
    return `This action returns all workHours`;
  }

  findOne(id: number) {
    return `This action returns a #${id} workHour`;
  }

  update(id: number, updateWorkHourDto: UpdateWorkHourDto) {
    return `This action updates a #${id} workHour`;
  }

  remove(id: number) {
    return `This action removes a #${id} workHour`;
  }
}

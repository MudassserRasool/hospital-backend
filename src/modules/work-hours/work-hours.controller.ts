import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkHoursService } from './work-hours.service';
import { CreateWorkHourDto } from './dto/create-work-hour.dto';
import { UpdateWorkHourDto } from './dto/update-work-hour.dto';

@Controller('work-hours')
export class WorkHoursController {
  constructor(private readonly workHoursService: WorkHoursService) {}

  @Post()
  create(@Body() createWorkHourDto: CreateWorkHourDto) {
    return this.workHoursService.create(createWorkHourDto);
  }

  @Get()
  findAll() {
    return this.workHoursService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workHoursService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkHourDto: UpdateWorkHourDto) {
    return this.workHoursService.update(+id, updateWorkHourDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workHoursService.remove(+id);
  }
}

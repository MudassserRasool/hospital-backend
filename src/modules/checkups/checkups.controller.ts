import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CheckupsService } from './checkups.service';
import { CreateCheckupDto } from './dto/create-checkup.dto';
import { UpdateCheckupDto } from './dto/update-checkup.dto';

@Controller('checkups')
export class CheckupsController {
  constructor(private readonly checkupsService: CheckupsService) {}

  @Post()
  create(@Body() createCheckupDto: CreateCheckupDto) {
    return this.checkupsService.create(createCheckupDto);
  }

  @Get()
  findAll() {
    return this.checkupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkupsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCheckupDto: UpdateCheckupDto) {
    return this.checkupsService.update(+id, updateCheckupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checkupsService.remove(+id);
  }
}

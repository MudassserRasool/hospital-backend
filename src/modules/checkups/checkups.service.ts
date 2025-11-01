import { Injectable } from '@nestjs/common';
import { CreateCheckupDto } from './dto/create-checkup.dto';
import { UpdateCheckupDto } from './dto/update-checkup.dto';

@Injectable()
export class CheckupsService {
  create(createCheckupDto: CreateCheckupDto) {
    return 'This action adds a new checkup';
  }

  findAll() {
    return `This action returns all checkups`;
  }

  findOne(id: number) {
    return `This action returns a #${id} checkup`;
  }

  update(id: number, updateCheckupDto: UpdateCheckupDto) {
    return `This action updates a #${id} checkup`;
  }

  remove(id: number) {
    return `This action removes a #${id} checkup`;
  }
}

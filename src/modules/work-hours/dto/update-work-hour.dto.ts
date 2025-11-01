import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkHourDto } from './create-work-hour.dto';

export class UpdateWorkHourDto extends PartialType(CreateWorkHourDto) {}

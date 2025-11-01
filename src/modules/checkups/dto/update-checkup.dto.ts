import { PartialType } from '@nestjs/mapped-types';
import { CreateCheckupDto } from './create-checkup.dto';

export class UpdateCheckupDto extends PartialType(CreateCheckupDto) {}

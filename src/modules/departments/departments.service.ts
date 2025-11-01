import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
  ) {}

  async create(createDto: any) {
    const department = await this.departmentModel.create(createDto);
    return department.populate('hospitalId', 'name');
  }

  async findAll(hospitalId?: string) {
    const query = hospitalId ? { hospitalId } : {};
    return this.departmentModel.find(query).populate('hospitalId', 'name').exec();
  }

  async findOne(id: string) {
    const department = await this.departmentModel.findById(id).populate('hospitalId').exec();
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async update(id: string, updateDto: any) {
    const department = await this.departmentModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async remove(id: string) {
    await this.departmentModel.findByIdAndDelete(id).exec();
    return { message: 'Department deleted' };
  }
}

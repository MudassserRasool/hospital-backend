import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { Hospital, HospitalDocument } from './entities/hospital.entity';

@Injectable()
export class HospitalsService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
  ) {}

  async create(createHospitalDto: CreateHospitalDto) {
    // Check if hospital with same name exists
    const existing = await this.hospitalModel.findOne({
      name: createHospitalDto.name,
    });

    if (existing) {
      throw new ConflictException('Hospital with this name already exists');
    }

    const hospital = await this.hospitalModel.create({
      ...createHospitalDto,
      isActive: true,
      totalStaff: 0,
      totalPatients: 0,
    });

    return hospital;
  }

  async findAll(filters?: any) {
    const query: any = {};

    // Extract search parameter if provided
    if (filters?.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { 'address.city': { $regex: searchTerm, $options: 'i' } },
        { 'address.state': { $regex: searchTerm, $options: 'i' } },
        { 'address.street': { $regex: searchTerm, $options: 'i' } },
        { 'contact.email': { $regex: searchTerm, $options: 'i' } },
        { 'contact.phone': { $regex: searchTerm, $options: 'i' } },
        { specialties: { $in: [new RegExp(searchTerm, 'i')] } },
      ];
    }

    // Handle other filter parameters (excluding 'search')
    Object.keys(filters || {}).forEach((key) => {
      if (
        key !== 'search' &&
        filters[key] !== undefined &&
        filters[key] !== ''
      ) {
        query[key] = filters[key];
      }
    });

    const hospitals = await this.hospitalModel
      .find(query)
      .populate('ownerId', 'firstName lastName email')
      .exec();
    return hospitals;
  }

  async findOne(id: string) {
    const hospital = await this.hospitalModel
      .findById(id)
      .populate('ownerId', 'firstName lastName email phone')
      .exec();

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return hospital;
  }

  async findByOwner(ownerId: string) {
    const hospitals = await this.hospitalModel
      .find({ ownerId })
      .populate('ownerId', 'firstName lastName email')
      .exec();
    return hospitals;
  }

  async update(id: string, updateHospitalDto: UpdateHospitalDto) {
    const hospital = await this.hospitalModel
      .findByIdAndUpdate(id, updateHospitalDto, { new: true })
      .populate('ownerId', 'firstName lastName email')
      .exec();

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return hospital;
  }

  async deactivate(id: string) {
    const hospital = await this.hospitalModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return { message: 'Hospital deactivated successfully' };
  }

  async remove(id: string) {
    const hospital = await this.hospitalModel.findByIdAndDelete(id).exec();

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return { message: 'Hospital deleted successfully' };
  }

  async getHospitalStaff(hospitalId: string) {
    // This will be implemented when we integrate with Users module
    // For now, return placeholder
    const hospital = await this.findOne(hospitalId);
    return {
      hospital: hospital.name,
      totalStaff: hospital.totalStaff,
      message: 'Staff details will be fetched from Users module',
    };
  }

  async getHospitalAnalytics(hospitalId: string) {
    const hospital = await this.findOne(hospitalId);

    // Basic analytics - will be expanded in Analytics module
    const analytics = {
      hospital: {
        id: hospital._id,
        name: hospital.name,
      },
      overview: {
        totalStaff: hospital.totalStaff || 0,
        totalPatients: hospital.totalPatients || 0,
        activeStatus: hospital.isActive,
        specialties: hospital.specialties?.length || 0,
      },
      facilities: hospital.facilities || [],
      workingHours: hospital.workingHours || [],
    };

    return analytics;
  }

  async searchHospitals(searchTerm: string) {
    const hospitals = await this.hospitalModel
      .find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { 'address.city': { $regex: searchTerm, $options: 'i' } },
          { 'address.state': { $regex: searchTerm, $options: 'i' } },
          { specialties: { $in: [new RegExp(searchTerm, 'i')] } },
        ],
        isActive: true,
      })
      .populate('ownerId', 'firstName lastName')
      .exec();

    return hospitals;
  }

  async getNearbyHospitals(
    latitude: number,
    longitude: number,
    maxDistance: number = 10000,
  ) {
    // Find hospitals within maxDistance (in meters)
    const hospitals = await this.hospitalModel
      .find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
        isActive: true,
      })
      .populate('ownerId', 'firstName lastName')
      .exec();

    return hospitals;
  }

  async updateStaffCount(hospitalId: string, count: number) {
    await this.hospitalModel.findByIdAndUpdate(hospitalId, {
      totalStaff: count,
    });
  }

  async updatePatientCount(hospitalId: string, count: number) {
    await this.hospitalModel.findByIdAndUpdate(hospitalId, {
      totalPatients: count,
    });
  }

  async getMobilePackageId(id: string) {
    const hospital = await this.hospitalModel.findOne({ mobilePackageId: id });
    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }
    return hospital;
  }
}

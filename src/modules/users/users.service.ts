import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existing = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password if provided
    let hashedPassword;
    if (createUserDto.password) {
      hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    }

    const user = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
      isActive: true,
      isBlocked: false,
    });

    return this.sanitizeUser(user);
  }

  async findAll(filters?: any) {
    const query = filters || {};
    const users = await this.userModel
      .find(query)
      .populate('hospitalId', 'name logo')
      .exec();
    return users.map((user) => this.sanitizeUser(user));
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .populate('hospitalId', 'name logo')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .populate('hospitalId', 'name logo')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async remove(id: string) {
    // Soft delete - just deactivate
    const user = await this.userModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deleted successfully' };
  }

  async blockUser(id: string, reason: string, blockedBy: string) {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          isBlocked: true,
          blockedReason: reason,
          blockedAt: new Date(),
          blockedBy,
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async unblockUser(id: string) {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          isBlocked: false,
          blockedReason: null,
          blockedAt: null,
          blockedBy: null,
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async getUsersByHospital(hospitalId: string) {
    const users = await this.userModel.find({ hospitalId }).exec();
    return users.map((user) => this.sanitizeUser(user));
  }

  async getUsersByRole(role: string) {
    const users = await this.userModel.find({ role }).exec();
    return users.map((user) => this.sanitizeUser(user));
  }

  private sanitizeUser(user: any) {
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    delete userObj.refreshTokens;
    return userObj;
  }
}

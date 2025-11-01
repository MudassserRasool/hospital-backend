import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(action: string, userId: string, metadata?: any, ipAddress?: string, userAgent?: string) {
    const log = await this.auditLogModel.create({
      action,
      userId,
      metadata,
      ipAddress,
      userAgent,
    });
    return log;
  }

  async findAll(filters?: any, limit = 100) {
    const query = filters || {};
    return this.auditLogModel.find(query).populate('userId', 'firstName lastName email role').sort({ createdAt: -1 }).limit(limit).exec();
  }

  async findByUser(userId: string, limit = 50) {
    return this.auditLogModel.find({ userId }).populate('userId').sort({ createdAt: -1 }).limit(limit).exec();
  }
}

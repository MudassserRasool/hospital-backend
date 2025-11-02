import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';

export interface FileUploadResult {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

export interface FileUploadInterface {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

@Injectable()
export class FileUploadService {
  private readonly uploadPath: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(private configService: ConfigService) {
    // Get upload path from environment or use default
    this.uploadPath =
      process.env.UPLOAD_PATH || join(process.cwd(), 'uploads');

    // Get max file size (default: 5MB)
    this.maxFileSize =
      parseInt(process.env.MAX_FILE_SIZE || '5242880', 10);

    // Allowed file types
    this.allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Text
      'text/plain',
      'text/csv',
    ];

    // Ensure upload directory exists
    this.ensureUploadDirectoryExists();
  }

  private ensureUploadDirectoryExists() {
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }

    // Create subdirectories for different file types
    const subdirs = ['images', 'documents', 'other'];
    subdirs.forEach((dir) => {
      const dirPath = join(this.uploadPath, dir);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  private getFileCategory(mimetype: string): string {
    if (mimetype.startsWith('image/')) {
      return 'images';
    }
    if (
      mimetype.startsWith('application/') ||
      mimetype.startsWith('text/')
    ) {
      return 'documents';
    }
    return 'other';
  }

  private validateFile(file: FileUploadInterface): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  private generateUniqueFilename(originalName: string): string {
    const ext = extname(originalName);
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    return `${timestamp}-${uniqueId}${ext}`;
  }

  async uploadFile(file: FileUploadInterface): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const filename = this.generateUniqueFilename(file.originalname);
    const category = this.getFileCategory(file.mimetype);
    const destinationPath = join(this.uploadPath, category, filename);

    // Save file
    try {
      await fs.writeFile(destinationPath, file.buffer);
    } catch (error) {
      throw new BadRequestException(
        `Failed to save file: ${error.message}`,
      );
    }

    // Generate URL
    const baseUrl =
      this.configService.get<string>('BASE_URL') ||
      process.env.BASE_URL ||
      'http://localhost:3000';
    const apiPrefix =
      this.configService.get<string>('apiPrefix') ||
      process.env.API_PREFIX ||
      'api';

    const url = `${baseUrl}/${apiPrefix}/files/${category}/${filename}`;

    return {
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: destinationPath,
      url,
    };
  }

  async uploadMultipleFiles(
    files: FileUploadInterface[],
  ): Promise<FileUploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  async deleteFile(filename: string, category?: string): Promise<void> {
    try {
      // If category not provided, try to find file in all categories
      if (category) {
        const filePath = join(this.uploadPath, category, filename);
        await fs.unlink(filePath);
      } else {
        // Search in all categories
        const categories = ['images', 'documents', 'other'];
        let found = false;

        for (const cat of categories) {
          const filePath = join(this.uploadPath, cat, filename);
          try {
            await fs.unlink(filePath);
            found = true;
            break;
          } catch {
            // File not in this category, continue
          }
        }

        if (!found) {
          throw new BadRequestException('File not found');
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  getFileUrl(filename: string, category: string): string {
    const baseUrl =
      this.configService.get<string>('BASE_URL') ||
      process.env.BASE_URL ||
      'http://localhost:3000';
    const apiPrefix =
      this.configService.get<string>('apiPrefix') ||
      process.env.API_PREFIX ||
      'api';

    return `${baseUrl}/${apiPrefix}/files/${category}/${filename}`;
  }
}


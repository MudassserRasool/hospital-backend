import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../decorators/public.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import type { FileUploadInterface } from './file-upload.service';
import { FileUploadService } from './file-upload.service';

@ApiTags('File Upload')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @Roles('super_admin', 'owner', 'receptionist', 'doctor', 'patient', 'staff')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File uploaded successfully',
    schema: {
      example: {
        filename: '1234567890-uuid.jpg',
        originalName: 'example.jpg',
        mimetype: 'image/jpeg',
        size: 12345,
        path: './uploads/images/1234567890-uuid.jpg',
        url: 'http://localhost:3000/api/files/images/1234567890-uuid.jpg',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or file validation failed',
  })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|txt|csv)$/,
          }),
        ],
      }),
    )
    file: FileUploadInterface,
  ) {
    return this.fileUploadService.uploadFile(file);
  }

  @Post('upload/multiple')
  @Roles('super_admin', 'owner', 'receptionist', 'doctor', 'patient', 'staff')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Multiple files to upload (max 10)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Files uploaded successfully',
    schema: {
      example: [
        {
          filename: '1234567890-uuid.jpg',
          originalName: 'example1.jpg',
          mimetype: 'image/jpeg',
          size: 12345,
          url: 'http://localhost:3000/api/files/images/1234567890-uuid.jpg',
        },
        {
          filename: '1234567891-uuid.pdf',
          originalName: 'example2.pdf',
          mimetype: 'application/pdf',
          size: 23456,
          url: 'http://localhost:3000/api/files/documents/1234567891-uuid.pdf',
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid files or validation failed',
  })
  async uploadMultipleFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB per file
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|txt|csv)$/,
          }),
        ],
      }),
    )
    files: FileUploadInterface[],
  ) {
    return this.fileUploadService.uploadMultipleFiles(files);
  }

  @Delete(':category/:filename')
  @Roles('super_admin', 'owner', 'receptionist')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File deleted successfully',
    schema: {
      example: {
        message: 'File deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  async deleteFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
  ) {
    await this.fileUploadService.deleteFile(filename, category);
    return { message: 'File deleted successfully' };
  }

  @Get(':category/:filename')
  @Public()
  @ApiOperation({ summary: 'Get file URL' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File URL retrieved successfully',
  })
  getFileUrl(
    @Param('category') category: string,
    @Param('filename') filename: string,
  ) {
    const url = this.fileUploadService.getFileUrl(filename, category);
    return { url };
  }
}

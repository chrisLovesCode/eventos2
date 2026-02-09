import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('event-banner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload event banner image' })
  @ApiResponse({
    status: 201,
    description: 'File successfully uploaded',
    schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          example: 'http://localhost:3000/uploads/event-banner-abc123.webp',
          description: 'Public URL to the uploaded file',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file type or size',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'File too large (max 5MB)' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        // Additional validation at controller level
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Nur Bilder sind erlaubt'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Event-Banner (JPG, PNG, WebP - max 5MB)',
        },
      },
    },
  })
  async uploadEventBanner(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ path: string }> {
    if (!file) {
      throw new BadRequestException('Keine Datei hochgeladen');
    }

    const path = await this.filesService.uploadEventBanner(file);

    return { path };
  }
}

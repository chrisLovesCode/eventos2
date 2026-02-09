import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

export enum UploadType {
  EVENT_BANNER = 'event-banner',
  // Extensible for additional upload types
  // USER_AVATAR = 'user-avatar',
  // CATEGORY_IMAGE = 'category-image',
}

interface UploadConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  dimensions?: { width: number; height: number };
  outputFormat: 'webp' | 'jpeg' | 'png';
}

const UPLOAD_CONFIGS: Record<UploadType, UploadConfig> = {
  [UploadType.EVENT_BANNER]: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    dimensions: { width: 800, height: 400 },
    outputFormat: 'webp',
  },
};

@Injectable()
export class FilesService {
  private readonly uploadsDir: string;

  constructor(private configService: ConfigService) {
    // uploads Ordner in /app/uploads (api root)
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDirectory();
  }

  /**
   * Stellt sicher, dass das uploads-Verzeichnis existiert
   */
  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Validiert eine hochgeladene Datei
   */
  private validateFile(
    file: Express.Multer.File,
    uploadType: UploadType,
  ): void {
    const config = UPLOAD_CONFIGS[uploadType];

    // Größe prüfen
    if (file.size > config.maxSizeBytes) {
      throw new BadRequestException(
        `Datei ist zu groß. Maximum: ${config.maxSizeBytes / 1024 / 1024}MB`,
      );
    }

    // MIME-Type prüfen
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Ungültiger Dateityp. Erlaubt: ${config.allowedMimeTypes.join(', ')}`,
      );
    }

    // Dateiendung prüfen (zusätzliche Sicherheit)
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException('Ungültige Dateiendung');
    }
  }

  /**
   * Verarbeitet und speichert ein Event-Banner
   */
  async uploadEventBanner(file: Express.Multer.File): Promise<string> {
    const relativePath = await this.processUpload(
      file,
      UploadType.EVENT_BANNER,
    );
    // Return full URL to the uploaded file (use public URL for browser access)
    const apiPublicUrl =
      this.configService.get<string>('API_PUBLIC_URL') ||
      this.configService.get<string>('API_URL_HOST') ||
      'http://localhost:3000';
    return `${apiPublicUrl}${relativePath}`;
  }

  /**
   * Zentrale Upload-Verarbeitung mit Bildoptimierung
   */
  private async processUpload(
    file: Express.Multer.File,
    uploadType: UploadType,
  ): Promise<string> {
    this.validateFile(file, uploadType);

    const config = UPLOAD_CONFIGS[uploadType];
    const filename = `${uploadType}-${randomUUID()}.${config.outputFormat}`;
    const filepath = path.join(this.uploadsDir, filename);

    try {
      let sharpInstance = sharp(file.buffer);

      // Check metadata for additional security
      const metadata = await sharpInstance.metadata();
      if (
        !metadata.format ||
        !['jpeg', 'png', 'webp'].includes(metadata.format)
      ) {
        throw new BadRequestException('Ungültiges Bildformat');
      }

      // Bild verarbeiten
      if (config.dimensions) {
        sharpInstance = sharpInstance.resize(
          config.dimensions.width,
          config.dimensions.height,
          {
            fit: 'cover',
            position: 'center',
          },
        );
      }

      // Convert to WebP with optimization
      if (config.outputFormat === 'webp') {
        sharpInstance = sharpInstance.webp({ quality: 85 });
      }

      await sharpInstance.toFile(filepath);

      // Relative path for DB storage
      return `/uploads/${filename}`;
    } catch (error) {
      // Aufräumen bei Fehler
      try {
        await fs.unlink(filepath);
      } catch {
        // Ignore if file doesn't exist
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Fehler beim Verarbeiten der Datei',
      );
    }
  }

  /**
   * Löscht eine hochgeladene Datei
   */
  async deleteFile(filePath: string): Promise<void> {
    if (!filePath) return;

    try {
      // Security: Only delete files in uploads folder
      const filename = path.basename(filePath);
      const fullPath = path.join(this.uploadsDir, filename);

      // Prüfe ob Datei im uploads-Verzeichnis liegt
      const normalizedPath = path.normalize(fullPath);
      const normalizedUploadsDir = path.normalize(this.uploadsDir);

      if (!normalizedPath.startsWith(normalizedUploadsDir)) {
        throw new BadRequestException('Ungültiger Dateipfad');
      }

      await fs.unlink(fullPath);
    } catch (error) {
      // Only log deletion errors, don't throw
      console.error('Fehler beim Löschen der Datei:', error);
    }
  }

  /**
   * Gibt den absoluten Pfad zu einer Datei zurück
   */
  getFilePath(relativePath: string): string | null {
    if (!relativePath) return null;
    const filename = path.basename(relativePath);
    return path.join(this.uploadsDir, filename);
  }
}

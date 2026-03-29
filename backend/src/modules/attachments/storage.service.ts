import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {
    const accountId = config.get<string>('r2.accountId');
    this.bucket = config.get<string>('r2.bucketName') || 'project-milestone-files';
    this.publicUrl = config.get<string>('r2.publicUrl') || '';

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.get<string>('r2.accessKeyId') || '',
        secretAccessKey: config.get<string>('r2.secretAccessKey') || '',
      },
    });
  }

  async upload(
    file: Express.Multer.File,
    folder = 'attachments',
  ): Promise<{ key: string; url: string; size: number; mimeType: string }> {
    const ext = path.extname(file.originalname);
    const key = `${folder}/${uuid()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = this.publicUrl
      ? `${this.publicUrl}/${key}`
      : await this.getSignedUrl(key);

    return {
      key,
      url,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  async delete(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      this.logger.warn(`Failed to delete ${key} from R2: ${err}`);
    }
  }
}

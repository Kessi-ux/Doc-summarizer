import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT || 'localhost';
    const port = process.env.S3_PORT || '9000';
    const useSsl = (process.env.S3_USE_SSL || 'false') === 'true';
    const protocol = useSsl ? 'https' : 'http';

    this.bucket = process.env.S3_BUCKET || 'documents';
    this.client = new S3Client({
      region: 'us-east-1',
      endpoint: `${protocol}://${endpoint}:${port}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
    });
  }

  async upload(file: Express.Multer.File): Promise<{ key: string; url: string }> {
    try {
      const key = `${Date.now()}-${randomUUID()}-${file.originalname}`;
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const endpoint = process.env.S3_ENDPOINT || 'localhost';
      const port = process.env.S3_PORT || '9000';
      const useSsl = (process.env.S3_USE_SSL || 'false') === 'true';
      const protocol = useSsl ? 'https' : 'http';

      const url = `${protocol}://${endpoint}:${port}/${this.bucket}/${encodeURIComponent(key)}`;
      return { key, url };
    } catch (err) {
      console.error('S3 upload error:', err);
      throw new InternalServerErrorException('Failed to upload file to S3/MinIO');
    }
  }
}


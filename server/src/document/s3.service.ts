import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    const rawRegion = (process.env.AWS_REGION || 'us-east-1').trim();
    const regionMatch = rawRegion.match(/[a-z]{2}-[a-z]+-\d/i);
    this.region = regionMatch ? regionMatch[0].toLowerCase() : 'us-east-1';
    
    this.bucket = (process.env.AWS_S3_BUCKET_NAME || '').trim();

    const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();

    this.logger.log(`[S3Service] Initializing. Region: ${this.region} (parsed from "${rawRegion}"), Bucket: ${this.bucket}`);

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    if (!this.bucket) {
      this.logger.warn(
        '[S3Service] AWS_S3_BUCKET_NAME is not set. S3 operations will fail.',
      );
    }
  }

  /**
   * Upload a file buffer to S3.
   * @param key  The S3 object key (path in bucket), e.g. "documents/userId/aadhaar-1234567890.jpg"
   * @param body The file content as a Buffer
   * @param contentType The MIME type of the file
   * @returns The public-style key (not a signed URL) stored in the DB
   */
  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    this.logger.log(`[S3Service] Uploading: ${key} (${contentType})`);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Private by default — access via presigned URLs only
      }),
    );

    this.logger.log(`[S3Service] Uploaded successfully: ${key}`);
    return key;
  }

  /**
   * Generate a pre-signed GET URL valid for `expiresIn` seconds (default 3600 = 1 hour).
   */
  async getPresignedUrl(key: string, expiresIn = 3600, downloadFilename?: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(downloadFilename ? { ResponseContentDisposition: `attachment; filename="${downloadFilename}"` } : {}),
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Fetch file buffer directly from S3.
   * Returns null if key does not exist or fetch fails.
   */
  async getFileBuffer(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    if (!key || key.startsWith('in.gov.')) return null;
    this.logger.log(`[S3Service] Fetching file buffer for key: ${key}`);

    const keyWithoutExt = key.replace(/\.[^/.]+$/, '');
    const keysToTry = Array.from(
      new Set([
        key,
        `${keyWithoutExt}.pdf`,
        `${keyWithoutExt}.jpeg`,
        `${keyWithoutExt}.jpg`,
        `${keyWithoutExt}.png`,
        keyWithoutExt,
      ]),
    );

    for (const tryKey of keysToTry) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: tryKey,
        });
        const response = await this.client.send(command);
        if (!response.Body) continue;

        const stream = response.Body as any;
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        let contentType = response.ContentType || 'application/pdf';
        if (!response.ContentType || response.ContentType === 'binary/octet-stream' || response.ContentType === 'application/octet-stream') {
          if (tryKey.endsWith('.jpg') || tryKey.endsWith('.jpeg')) contentType = 'image/jpeg';
          else if (tryKey.endsWith('.png')) contentType = 'image/png';
          else if (tryKey.endsWith('.pdf')) contentType = 'application/pdf';
        }
        return {
          buffer,
          contentType,
        };
      } catch (err: any) {
        // Try next candidate key
      }
    }

    this.logger.warn(`[S3Service] getFileBuffer failed for all candidate keys of: ${key}`);
    return null;
  }

  /**
   * Delete an object from S3 by its key.
   */
  async delete(key: string): Promise<void> {
    this.logger.log(`[S3Service] Deleting: ${key}`);
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`[S3Service] Deleted: ${key}`);
    } catch (err) {
      this.logger.error(`[S3Service] Delete failed for key ${key}:`, err);
      // Don't throw — deletion failures should not block UI flows
    }
  }

  /**
   * Build a deterministic S3 key for a user document.
   * Format: documents/{userId}/{docType}/{timestamp}-{originalName}
   */
  buildKey(userId: string, docType: string, originalname: string): string {
    const sanitizedName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `documents/${userId}/${docType}/${Date.now()}-${sanitizedName}`;
  }
}

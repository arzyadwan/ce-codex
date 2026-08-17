import { BadRequestException, Injectable } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { parseMediaUpload } from "./media-policy.js";

@Injectable()
export class MediaService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) throw new Error("Konfigurasi Cloudflare R2 belum lengkap.");
    this.bucket = bucket;
    this.client = new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
  }

  async createUploadUrl(userId: string, input: unknown) {
    try {
      const media = parseMediaUpload(input);
      const now = new Date();
      const folder = media.purpose === "advertisement" ? "advertisements" : "articles";
      const key = `${folder}/${userId}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${media.extension}`;
      const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: media.contentType, ContentLength: media.size, Metadata: { uploadedBy: userId } });
      const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
      const publicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
      return { uploadUrl, key, publicUrl: publicBase ? `${publicBase}/${key}` : null, expiresIn: 300, requiredHeaders: { "Content-Type": media.contentType } };
    } catch (error) {
      if (error instanceof ZodError) throw new BadRequestException(error.flatten());
      throw error;
    }
  }
}

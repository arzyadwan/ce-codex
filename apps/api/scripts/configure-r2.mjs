import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

const origins = [...new Set([process.env.NEXT_PUBLIC_APP_URL, ...(process.env.CORS_ORIGIN ?? "").split(",")].filter(Boolean))];
if (!origins.length) throw new Error("Origin aplikasi belum dikonfigurasi.");
const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
await client.send(new PutBucketCorsCommand({ Bucket: process.env.R2_BUCKET_NAME, CORSConfiguration: { CORSRules: [{ AllowedOrigins: origins, AllowedMethods: ["GET", "HEAD", "PUT"], AllowedHeaders: ["Content-Type"], ExposeHeaders: ["ETag"], MaxAgeSeconds: 3600 }] } }));
console.log(`R2_CORS_CONFIGURED=${origins.length}_ORIGIN`);

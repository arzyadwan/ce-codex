import { requestMediaUploadSchema, type RequestMediaUploadInput } from "@crypto-exist/contracts";

const extensions: Record<RequestMediaUploadInput["contentType"], string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
};

export function parseMediaUpload(input: unknown) {
  const parsed = requestMediaUploadSchema.parse(input);
  return { ...parsed, extension: extensions[parsed.contentType] };
}

import type { NextConfig } from "next";
const publicMedia = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
if (publicMedia) {
  const mediaUrl = new URL(publicMedia);
  remotePatterns.push({ protocol: mediaUrl.protocol.replace(":", "") as "http" | "https", hostname: mediaUrl.hostname, pathname: `${mediaUrl.pathname.replace(/\/$/, "")}/**` });
}
const nextConfig: NextConfig = { reactStrictMode: true, images: { remotePatterns } };
export default nextConfig;

import type { NextConfig } from "next";
const publicMedia = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
if (publicMedia) {
  const mediaUrl = new URL(publicMedia);
  remotePatterns.push({ protocol: mediaUrl.protocol.replace(":", "") as "http" | "https", hostname: mediaUrl.hostname, pathname: `${mediaUrl.pathname.replace(/\/$/, "")}/**` });
}
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'${process.env.NODE_ENV === "production" ? "; upgrade-insecure-requests" : ""}`,
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { remotePatterns },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;

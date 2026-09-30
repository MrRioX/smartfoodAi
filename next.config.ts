import type { NextConfig } from "next";

// SmartFood AI — Next.js configuration
// - output "standalone" kept for lightweight production/WebView packaging.
// - allowedDevOrigins: extra origins (e.g. http://192.168.x.x:3000) allowed when
//   testing from a phone over Wi-Fi. Driven by the DEV_ALLOWED_ORIGINS env var
//   (comma-separated) so the IP can change without editing this file.
// - TypeScript errors are NOT ignored: `npm run build` fails on real type errors.
const devOrigins = (process.env.DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  ...(devOrigins.length > 0 ? { allowedDevOrigins: devOrigins } : {}),
};

export default nextConfig;

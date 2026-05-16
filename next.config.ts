import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["heic-convert", "sharp"],
};

export default nextConfig;

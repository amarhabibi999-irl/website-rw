import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mengizinkan akses dari domain luar (Cloudflare/IP HP)
  allowedDevOrigins: ["*.trycloudflare.com", "*"], 
};

export default nextConfig;
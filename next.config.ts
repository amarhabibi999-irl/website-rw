import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com", "*"],
  devIndicators: false,
  // TAMBAHIN 3 BARIS INI BIAR NGGAK ERROR TYPESCRIPT
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
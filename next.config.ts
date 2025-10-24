import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
 
  eslint: {
    // ✅ This line tells Next.js to build even if ESLint finds errors
    ignoreDuringBuilds: true,
  },
};


export default nextConfig;

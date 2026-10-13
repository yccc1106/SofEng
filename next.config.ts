import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [{ source: "/java/:path*", destination: `${process.env.JAVA_BACKEND_URL || "http://localhost:8080"}/api/:path*` }];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Unsplash is used for placeholder photography during the build.
    // Real media moves to the S3/R2 bucket in Phase 2.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;

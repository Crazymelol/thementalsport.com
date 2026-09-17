import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore the fencing-ai subdirectory which has its own Next.js app
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
};

export default nextConfig;

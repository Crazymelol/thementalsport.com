import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/free',
        destination: '/start-here',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

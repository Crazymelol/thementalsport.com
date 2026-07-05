import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/free',
        destination: '/start-here',
        permanent: false,
      },
      {
        // Web preview of the training app (static Expo export in public/app).
        // public/ has no directory-index behavior, so point /app at the file.
        source: '/app',
        destination: '/app/index.html',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

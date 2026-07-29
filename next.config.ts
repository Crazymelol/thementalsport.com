import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a fully static site (output: 'export') for free
// hosting on GitHub Pages. Server features (redirects, image optimization,
// route handlers) don't exist in that mode, so they're gated off here and the
// email signups post to ConvertKit's public form endpoint client-side instead.
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        images: { unoptimized: true },
      }
    : {
        async redirects() {
          return [
            {
              source: "/free",
              destination: "/start-here",
              permanent: false,
            },
          ];
        },
      }),
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mina's brain (the Anthropic SDK) only ever runs server-side in the
  // /api/chat route. Nothing secret is bundled into the browser.
  reactStrictMode: true,
};

export default nextConfig;

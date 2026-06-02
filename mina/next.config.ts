import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mina's brain and integrations only ever run server-side in the /api/chat
  // route. Nothing secret is bundled into the browser.
  reactStrictMode: true,
  // Keep the mail libraries out of the bundler; they're Node-only and run in
  // the serverless function as-is.
  serverExternalPackages: ["imapflow", "nodemailer"],
};

export default nextConfig;

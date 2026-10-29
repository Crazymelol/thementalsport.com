import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a fully static site (output: 'export') for free
// hosting on GitHub Pages. Server features (redirects, image optimization,
// route handlers) don't exist in that mode, so they're gated off here and the
// email signups post to ConvertKit's public form endpoint client-side instead.
const isStaticExport = process.env.STATIC_EXPORT === "1";
const coverImagePattern = {
  pathname: "/covers/**",
};
const aboutImagePattern = {
  pathname: "/about/**",
};

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true, localPatterns: [coverImagePattern, aboutImagePattern] },
      }
    : {
        images: { localPatterns: [coverImagePattern, aboutImagePattern] },
        async redirects() {
          // Old URLs that 404 in Web Analytics. None of these are app routes.
          // /blueprint was never a page in this repo (checked full git history),
          // so it goes to the course — the current equivalent of a "full system"
          // offer — along with the other dead product URLs.
          const toCourse = ["/blueprint", "/courses", "/pricing", "/checkout", "/programs"].map(
            (source) => ({
              source,
              destination: "/course",
              permanent: true,
            }),
          );
          return [
            {
              source: "/free",
              destination: "/start-here",
              permanent: false,
            },
            ...toCourse,
          ];
        },
      }),
};

export default nextConfig;

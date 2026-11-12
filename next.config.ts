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
          // Old product URLs, each listed explicitly. No /products/:slug catch-all,
          // so an unknown product path still 404s instead of landing on a missing book.
          // physiological-peak-performance is not a book id; the live slug is
          // physiological-performance (title: Physiological Peak Performance Blueprint).
          const toBook = [
            ["/products/adhd-athletes-edge", "/book/adhd-athletes-edge"],
            ["/products/physiological-peak-performance", "/book/physiological-performance"],
            ["/products/physiological-performance", "/book/physiological-performance"],
            ["/products/confidence-building", "/book/confidence-building"],
            ["/products/mental-blocks", "/book/mental-blocks"],
            ["/products/resilient-confidence", "/book/resilient-confidence"],
            ["/products/the-competition-protocol", "/book/the-competition-protocol"],
            ["/products/unbreakable", "/book/unbreakable"],
          ].map(([source, destination]) => ({
            source,
            destination,
            permanent: true,
          }));
          return [
            {
              source: "/free",
              destination: "/start-here#protocol",
              permanent: false,
            },
            // Old blog URL that still gets visits. The live post is the Day 7 article.
            {
              source: "/blogs/mental-performance/day-7-hacking-the-crowd-the-djokovic-reframe",
              destination: "/blog/titans-protocol-day-07-hacking-the-crowd",
              permanent: true,
            },
            // Old product URL. The live page is the book route for this title.
            {
              source: "/products/nurturing-self-worth",
              destination: "/book/nurturing-self-worth",
              permanent: true,
            },
            ...toBook,
            ...toCourse,
          ];
        },
      }),
};

export default nextConfig;

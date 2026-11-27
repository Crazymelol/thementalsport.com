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
          // overcoming-mental-blocks is the book title, not the id. The live slug
          // is mental-blocks (title: Overcoming Mental Blocks).
          const toBook = [
            ["/products/adhd-athletes-edge", "/book/adhd-athletes-edge"],
            ["/products/physiological-peak-performance", "/book/physiological-performance"],
            ["/products/physiological-performance", "/book/physiological-performance"],
            ["/products/confidence-building", "/book/confidence-building"],
            ["/products/mental-blocks", "/book/mental-blocks"],
            ["/products/resilient-confidence", "/book/resilient-confidence"],
            ["/products/the-competition-protocol", "/book/the-competition-protocol"],
            ["/products/unbreakable", "/book/unbreakable"],
            ["/overcoming-mental-blocks", "/book/mental-blocks"],
            ["/products/overcoming-mental-blocks", "/book/mental-blocks"],
          ].map(([source, destination]) => ({
            source,
            destination,
            permanent: true,
          }));
          // Bare legacy book paths. Exact sources only: none of these are app
          // routes or article slugs. /resources/competition-protocol is a live
          // page and is intentionally not listed.
          const bareBook = [
            ["/confidence-building", "/book/confidence-building"],
            ["/the-competition-protocol", "/book/the-competition-protocol"],
            ["/competition-protocol", "/book/the-competition-protocol"],
            ["/resilient-confidence", "/book/resilient-confidence"],
            ["/unlocking-resilient-confidence", "/book/resilient-confidence"],
            ["/physiological-performance", "/book/physiological-performance"],
            ["/physiological-peak-performance", "/book/physiological-performance"],
            ["/adhd-athletes-edge", "/book/adhd-athletes-edge"],
            ["/mental-blocks", "/book/mental-blocks"],
            ["/unbreakable", "/book/unbreakable"],
            ["/nurturing-self-worth", "/book/nurturing-self-worth"],
            ["/products/unlocking-resilient-confidence", "/book/resilient-confidence"],
            ["/products/competition-protocol", "/book/the-competition-protocol"],
          ].map(([source, destination]) => ({
            source,
            destination,
            permanent: true,
          }));
          return [
            // Facebook appends a newline and a pointing-hand emoji, or newlines
            // plus "TAGS:", onto a real path. Next matches the raw request path,
            // where those bytes stay percent-encoded. The colon is escaped so
            // path-to-regexp does not treat it as a parameter. %3A is a separate
            // path because it is not decoded before matching.
            {
              source: "/free-guide%0A%F0%9F%91%89",
              destination: "/free-guide",
              permanent: true,
            },
            {
              source: "/books%0A%0ATAGS\\:/nsport",
              destination: "/books",
              permanent: true,
            },
            {
              source: "/books%0A%0ATAGS%3A/nsport",
              destination: "/books",
              permanent: true,
            },
            {
              source: "/free",
              destination: "/free-guide",
              permanent: true,
            },
            {
              source: "/resources/competition-protocol",
              destination: "/free-guide",
              permanent: true,
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
            // Exact path only. Next.js anchors the source, so this does not
            // match /book/mental-blocks or any other /book/:slug page.
            {
              source: "/book",
              destination: "/books",
              permanent: true,
            },
            ...toBook,
            ...bareBook,
            ...toCourse,
          ];
        },
      }),
};

export default nextConfig;

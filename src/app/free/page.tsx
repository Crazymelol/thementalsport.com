// Static replacement for the /free -> /start-here redirect (server redirects
// don't exist in output:'export'). Redirects client-side, with a visible link
// fallback for no-JS.
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function FreeRedirect() {
  useEffect(() => {
    window.location.replace("/start-here");
  }, []);

  return (
    <main style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
      <p>
        Taking you to the free guide… If nothing happens,{" "}
        <Link href="/start-here">tap here</Link>.
      </p>
    </main>
  );
}

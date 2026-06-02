import { oauthClient } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing ?code from Google.", { status: 400 });
  }
  const redirectUri = new URL("/api/google/callback", req.url).toString();
  const client = oauthClient(redirectUri);
  try {
    const { tokens } = await client.getToken(code);
    const refresh = tokens.refresh_token;
    if (!refresh) {
      return htmlPage(
        "No refresh token returned",
        "Google didn't return a refresh token. Remove this app at " +
          "https://myaccount.google.com/permissions and try connecting again.",
      );
    }
    return htmlPage(
      "Mike is connected to Google ✅",
      "Copy the value below and add it in Vercel as the environment variable " +
        "<b>GOOGLE_REFRESH_TOKEN</b>, then redeploy.<br><br><code>" +
        escapeHtml(refresh) +
        "</code>",
    );
  } catch (e) {
    return htmlPage("Connection failed", escapeHtml(e instanceof Error ? e.message : "Unknown error"));
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function htmlPage(title: string, body: string): Response {
  return new Response(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
     <style>body{font-family:system-ui;background:#0f1115;color:#e7e9ee;max-width:640px;margin:10vh auto;padding:0 1rem;line-height:1.6}
     code{display:block;word-break:break-all;background:#171a21;border:1px solid #262b36;padding:1rem;border-radius:8px;color:#5eead4}</style></head>
     <body><h1>${title}</h1><p>${body}</p></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

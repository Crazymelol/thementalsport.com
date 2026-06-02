import { NextResponse } from "next/server";
import { oauthClient, GOOGLE_SCOPES } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const redirectUri = new URL("/api/google/callback", req.url).toString();
  const client = oauthClient(redirectUri);
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
  });
  return NextResponse.redirect(url);
}

import { listAddenda } from "@/lib/promptStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const addenda = await listAddenda();
  return Response.json({ addenda });
}

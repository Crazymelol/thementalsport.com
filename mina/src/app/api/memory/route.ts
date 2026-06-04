import { listMemories } from "@/lib/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const memories = await listMemories(50);
  return Response.json({ memories });
}

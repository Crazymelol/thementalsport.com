import { listSkills } from "@/lib/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const skills = await listSkills(50);
  return Response.json({ skills });
}

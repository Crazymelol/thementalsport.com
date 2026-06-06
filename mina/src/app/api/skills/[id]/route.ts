import { deleteSkill } from "@/lib/skills";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await deleteSkill(id);
  return Response.json(result);
}

import { deleteMemory } from "@/lib/memory";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await deleteMemory(id);
  return Response.json(result);
}

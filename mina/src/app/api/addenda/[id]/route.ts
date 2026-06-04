import { setEnabled, removeAddendum } from "@/lib/promptStore";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { enabled: boolean };
  const result = await setEnabled(id, body.enabled);
  return Response.json(result);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await removeAddendum(id);
  return Response.json(result);
}

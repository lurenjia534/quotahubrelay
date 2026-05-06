import { jsonError, requireSessionUser } from "@/app/lib/quota/api";
import { deleteClientToken } from "@/app/lib/quota/store";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const user = await requireSessionUser(request);
  if (user instanceof Response) return user;

  const { tokenId } = await params;
  const deleted = await deleteClientToken(user.id, tokenId);
  if (!deleted) {
    return jsonError("not_found", "Client token not found.", 404);
  }

  return new Response(null, { status: 204 });
}

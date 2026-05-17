import { jsonError, requireApiUser } from "@/app/lib/quota/api";
import { getSubscriptionWithAutoRefresh } from "@/app/lib/quota/refresh";
import { deleteSubscription } from "@/app/lib/quota/store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  const user = await requireApiUser(request);
  if (user instanceof Response) return user;

  const { subscriptionId } = await params;
  const subscription = await getSubscriptionWithAutoRefresh(
    user.id,
    subscriptionId,
  );
  if (!subscription) {
    return jsonError("not_found", "Subscription not found.", 404);
  }

  return Response.json({ subscription });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  const user = await requireApiUser(request);
  if (user instanceof Response) return user;

  const { subscriptionId } = await params;
  const deleted = await deleteSubscription(user.id, subscriptionId);
  if (!deleted) {
    return jsonError("not_found", "Subscription not found.", 404);
  }

  return new Response(null, { status: 204 });
}

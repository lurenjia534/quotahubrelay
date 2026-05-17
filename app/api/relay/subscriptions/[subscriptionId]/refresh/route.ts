import {
  jsonError,
  providerErrorResponse,
  requireApiUser,
} from "@/app/lib/quota/api";
import { refreshSubscriptionSnapshot } from "@/app/lib/quota/refresh";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  const user = await requireApiUser(request);
  if (user instanceof Response) return user;

  const { subscriptionId } = await params;
  try {
    const result = await refreshSubscriptionSnapshot(user.id, subscriptionId);
    if (result.status === "not_found") {
      return jsonError("not_found", "Subscription not found.", 404);
    }
    if (result.status === "unsupported_provider") {
      return jsonError("unsupported_provider", "Unsupported provider.", 400);
    }

    return Response.json({ subscription: result.subscription });
  } catch (error) {
    return providerErrorResponse(error);
  }
}

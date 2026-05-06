import {
  jsonError,
  providerErrorResponse,
  requireApiUser,
} from "@/app/lib/quota/api";
import { providerById } from "@/app/lib/quota/providers";
import {
  getSubscriptionCredentials,
  markSubscriptionSyncError,
  updateSubscriptionSnapshot,
} from "@/app/lib/quota/store";
import { ProviderSyncError } from "@/app/lib/quota/types";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  const user = await requireApiUser(request);
  if (user instanceof Response) return user;

  const { subscriptionId } = await params;
  const stored = await getSubscriptionCredentials(user.id, subscriptionId);
  if (!stored) {
    return jsonError("not_found", "Subscription not found.", 404);
  }

  const provider = providerById(stored.subscription.providerId);
  if (!provider) {
    return jsonError("unsupported_provider", "Unsupported provider.", 400);
  }

  try {
    const capturedSnapshot = await provider.validate(stored.credentials);
    const subscription = await updateSubscriptionSnapshot(
      user.id,
      subscriptionId,
      capturedSnapshot,
    );
    return Response.json({ subscription });
  } catch (error) {
    await markSubscriptionSyncError(
      user.id,
      subscriptionId,
      error instanceof ProviderSyncError && error.type === "auth"
        ? "auth_failed"
        : "sync_error",
    );
    return providerErrorResponse(error);
  }
}

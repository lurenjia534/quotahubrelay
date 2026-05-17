import "server-only";

import { providerById } from "@/app/lib/quota/providers";
import {
  getRelaySettings,
  getSubscription,
  getSubscriptionCredentials,
  listSubscriptions,
  markSubscriptionSyncError,
  updateSubscriptionSnapshot,
} from "@/app/lib/quota/store";
import {
  ProviderSyncError,
  relayRefreshModeIntervals,
} from "@/app/lib/quota/types";
import type {
  QuotaSubscription,
  RelayRefreshMode,
} from "@/app/lib/quota/types";

export type RefreshSubscriptionSnapshotResult =
  | { status: "refreshed"; subscription: QuotaSubscription | null }
  | { status: "not_found" }
  | { status: "unsupported_provider" };

export async function listSubscriptionsWithAutoRefresh(userId: string) {
  const subscriptions = await listSubscriptions(userId);
  return refreshDueSubscriptions(userId, subscriptions);
}

export async function getSubscriptionWithAutoRefresh(userId: string, id: string) {
  const subscription = await getSubscription(userId, id);
  if (!subscription) return null;

  const settings = await getRelaySettings(userId);
  if (!isSubscriptionRefreshDue(subscription, settings.refreshMode)) {
    return subscription;
  }

  try {
    const result = await refreshSubscriptionSnapshot(userId, id);
    if (result.status === "refreshed") {
      return result.subscription;
    }
    if (result.status === "unsupported_provider") {
      await markSubscriptionSyncError(userId, id, "sync_error");
    }
  } catch {
    // Refresh errors are reflected in syncState, while reads keep returning the last snapshot.
  }

  return getSubscription(userId, id);
}

export async function refreshSubscriptionSnapshot(
  userId: string,
  id: string,
): Promise<RefreshSubscriptionSnapshotResult> {
  const stored = await getSubscriptionCredentials(userId, id);
  if (!stored) return { status: "not_found" };

  const provider = providerById(stored.subscription.providerId);
  if (!provider) return { status: "unsupported_provider" };

  try {
    const capturedSnapshot = await provider.validate(stored.credentials);
    const subscription = await updateSubscriptionSnapshot(
      userId,
      id,
      capturedSnapshot,
    );
    return { status: "refreshed", subscription };
  } catch (error) {
    await markSubscriptionSyncError(
      userId,
      id,
      error instanceof ProviderSyncError && error.type === "auth"
        ? "auth_failed"
        : "sync_error",
    );
    throw error;
  }
}

async function refreshDueSubscriptions(
  userId: string,
  subscriptions: QuotaSubscription[],
) {
  const settings = await getRelaySettings(userId);
  const dueSubscriptions = subscriptions.filter((subscription) =>
    isSubscriptionRefreshDue(subscription, settings.refreshMode),
  );

  if (dueSubscriptions.length === 0) {
    return subscriptions;
  }

  await Promise.allSettled(
    dueSubscriptions.map(async (subscription) => {
      const result = await refreshSubscriptionSnapshot(userId, subscription.id);
      if (result.status === "unsupported_provider") {
        await markSubscriptionSyncError(userId, subscription.id, "sync_error");
      }
    }),
  );

  return listSubscriptions(userId);
}

function isSubscriptionRefreshDue(
  subscription: QuotaSubscription,
  refreshMode: RelayRefreshMode,
) {
  const interval = relayRefreshModeIntervals[refreshMode];
  if (interval == null) return false;
  if (!subscription.snapshot) return true;

  const lastAttemptAt = Math.max(
    subscription.lastSyncedAt ?? 0,
    subscription.updatedAt,
  );
  return Date.now() - lastAttemptAt >= interval;
}

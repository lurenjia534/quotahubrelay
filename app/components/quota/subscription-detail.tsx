"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Database,
  Gauge,
  Layers3,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { QuotaSubscription } from "@/app/lib/quota/types";
import {
  MaterialAlert,
  MaterialBadge,
  MaterialButton,
  MaterialIconSurface,
  MaterialSectionHeader,
  materialButtonClassName,
} from "@/app/components/material/primitives";
import {
  DetailCallout,
  formatDateTime,
  getSubscriptionSummary,
  QuotaResourceUsage,
  SubscriptionStatusBadge,
  SummaryProgress,
} from "@/app/components/quota/subscription-display";
import {
  expressiveContainer,
  expressiveItem,
  expressiveListItem,
  materialDefaultSpatial,
} from "@/app/components/material/motion";

type SubscriptionDetailProps = {
  initialSubscription: QuotaSubscription;
};

export function SubscriptionDetail({
  initialSubscription,
}: SubscriptionDetailProps) {
  const router = useRouter();
  const [subscription, setSubscription] = useState(initialSubscription);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const summary = getSubscriptionSummary(subscription);
  const resources = subscription.snapshot?.resources ?? [];

  async function refreshSubscription() {
    setPendingAction("refresh");
    setMessage(null);

    const response = await fetch(
      `/api/relay/subscriptions/${subscription.id}/refresh`,
      { method: "POST" },
    );
    const payload = await safeJson(response);
    setPendingAction(null);

    if (!response.ok) {
      setMessage(
        payload?.error?.message ?? "Failed to refresh subscription snapshot.",
      );
      return;
    }

    setSubscription(payload.subscription);
    setMessage("Subscription snapshot refreshed.");
    router.refresh();
  }

  async function deleteSubscription() {
    setPendingAction("delete");
    setMessage(null);

    const response = await fetch(`/api/relay/subscriptions/${subscription.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await safeJson(response);
      setPendingAction(null);
      setMessage(payload?.error?.message ?? "Failed to delete subscription.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <motion.div
      animate="show"
      className="space-y-6"
      initial="hidden"
      variants={expressiveContainer}
    >
      <motion.div
        className="flex flex-wrap items-center justify-between gap-3"
        variants={expressiveItem}
      >
        <Link
          href="/dashboard"
          className={materialButtonClassName({
            size: "sm",
            variant: "tonal",
          })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Overview
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <MaterialButton
            variant="filled"
            size="md"
            onClick={refreshSubscription}
            disabled={pendingAction !== null}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {pendingAction === "refresh" ? "Refreshing..." : "Refresh"}
          </MaterialButton>
          <MaterialButton
            variant="danger"
            size="sm"
            onClick={deleteSubscription}
            disabled={pendingAction !== null}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {pendingAction === "delete" ? "Deleting..." : "Delete"}
          </MaterialButton>
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {message ? (
          <motion.div
            key={message}
            layout
            animate="show"
            exit="exit"
            initial="hidden"
            variants={expressiveListItem}
          >
            <MaterialAlert variant={isErrorMessage(message) ? "error" : "success"}>
              {message}
            </MaterialAlert>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.section
        className="border-b border-outline-variant pb-6"
        layout
        variants={expressiveItem}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
          <div className="min-w-0">
            <div className="flex min-w-0 gap-4">
              <MaterialIconSurface tone="secondary" size="lg">
                <Database className="size-7" aria-hidden="true" />
              </MaterialIconSurface>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="min-w-0 md-headline-medium md-emphasized text-on-surface">
                    {subscription.displayTitle}
                  </h2>
                  <SubscriptionStatusBadge state={subscription.syncState} />
                </div>
                <p className="mt-2 md-body-large text-on-surface-variant">
                  {subscription.providerDisplayName}
                  {subscription.lastSyncedAt
                    ? ` · synced ${formatDateTime(subscription.lastSyncedAt)}`
                    : " · no sync yet"}
                </p>
              </div>
            </div>
          </div>

          <motion.div
            className="md-expressive-surface bg-surface-container-low px-4 py-4"
            layout
          >
            <div className="mb-3 flex items-center gap-3">
              <MaterialIconSurface tone="primary" size="sm">
                <Gauge className="size-5" aria-hidden="true" />
              </MaterialIconSurface>
              <div>
                <p className="md-label-large md-emphasized text-on-surface">
                  Plan risk
                </p>
                <MaterialBadge className="mt-1" variant={summary.riskVariant}>
                  {summary.riskLabel}
                </MaterialBadge>
              </div>
            </div>
            <SummaryProgress summary={summary} />
          </motion.div>
        </div>

        <div className="mt-6 grid border-y border-outline-variant py-2 sm:grid-cols-2 sm:divide-x sm:divide-outline-variant xl:grid-cols-4">
          <DetailCallout label="Resources" value={summary.resourceCount} />
          <DetailCallout label="Windows" value={summary.windowCount} />
          <DetailCallout
            label="Highest usage"
            value={
              summary.highestUsagePercent == null
                ? "Not reported"
                : `${summary.highestUsagePercent}%`
            }
          />
          <DetailCallout
            label="Created"
            value={formatDateTime(subscription.createdAt)}
          />
        </div>
      </motion.section>

      <motion.section variants={expressiveItem}>
        <MaterialSectionHeader
          action={
            <MaterialBadge variant="secondary">
              {resources.length} resource{resources.length === 1 ? "" : "s"}
            </MaterialBadge>
          }
          className="border-b border-outline-variant pb-5"
          description="Model, plan, and feature quota windows for this subscription."
          icon={<Layers3 className="size-6" aria-hidden="true" />}
          title="Quota detail"
          tone="tertiary"
        />

        <AnimatePresence initial={false} mode="popLayout">
          {resources.length > 0 ? (
            <motion.div
              className="divide-y divide-outline-variant border-b border-outline-variant"
              layout
            >
              {resources.map((resource) => (
                <QuotaResourceUsage key={resource.key} resource={resource} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty-quota-detail"
              layout
              animate="show"
              className="py-14 text-center"
              exit="exit"
              initial="hidden"
              transition={materialDefaultSpatial}
              variants={expressiveListItem}
            >
              <MaterialIconSurface
                className="mx-auto mb-4"
                size="lg"
                tone="secondary"
              >
                <Layers3 className="size-6" aria-hidden="true" />
              </MaterialIconSurface>
              <h3 className="md-title-large md-emphasized text-on-surface">
                No quota snapshot yet
              </h3>
              <p className="mx-auto mt-2 max-w-md md-body-medium text-on-surface-variant">
                Refresh this subscription to fetch the latest provider state.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("failed") || normalized.includes("error");
}

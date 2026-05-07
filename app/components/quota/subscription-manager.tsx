"use client";

import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  ProviderDescriptor,
  QuotaResource,
  QuotaSubscription,
  QuotaWindow,
} from "@/app/lib/quota/types";

type SubscriptionManagerProps = {
  initialProviders: ProviderDescriptor[];
  initialSubscriptions: QuotaSubscription[];
};

export function SubscriptionManager({
  initialProviders,
  initialSubscriptions,
}: SubscriptionManagerProps) {
  const [providers] = useState(initialProviders);
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [selectedProviderId, setSelectedProviderId] = useState(
    initialProviders[0]?.id ?? "",
  );
  const [customTitle, setCustomTitle] = useState("");
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>(
    {},
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === selectedProviderId),
    [providers, selectedProviderId],
  );

  async function createSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProvider) return;

    setPendingAction("create");
    setMessage(null);
    const response = await fetch("/api/relay/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: selectedProvider.id,
        customTitle,
        credentials: { values: credentialValues },
      }),
    });
    const payload = await response.json();
    setPendingAction(null);

    if (!response.ok) {
      setMessage(payload.error?.message ?? "Failed to create subscription.");
      return;
    }

    setSubscriptions((current) => [payload.subscription, ...current]);
    setCustomTitle("");
    setCredentialValues({});
    setMessage("Subscription connected.");
  }

  async function refreshSubscription(subscriptionId: string) {
    setPendingAction(`refresh:${subscriptionId}`);
    setMessage(null);
    const response = await fetch(
      `/api/relay/subscriptions/${subscriptionId}/refresh`,
      { method: "POST" },
    );
    const payload = await response.json();
    setPendingAction(null);

    if (!response.ok) {
      setMessage(payload.error?.message ?? "Refresh failed.");
      return;
    }

    setSubscriptions((current) =>
      current.map((subscription) =>
        subscription.id === subscriptionId ? payload.subscription : subscription,
      ),
    );
  }

  async function deleteSubscription(subscriptionId: string) {
    setPendingAction(`delete:${subscriptionId}`);
    setMessage(null);
    const response = await fetch(`/api/relay/subscriptions/${subscriptionId}`, {
      method: "DELETE",
    });
    setPendingAction(null);

    if (!response.ok) {
      const payload = await response.json();
      setMessage(payload.error?.message ?? "Delete failed.");
      return;
    }

    setSubscriptions((current) =>
      current.filter((subscription) => subscription.id !== subscriptionId),
    );
  }

  return (
    <div className="space-y-10">
      {message ? (
        <p className="border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          {message}
        </p>
      ) : null}

      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-medium text-zinc-950 dark:text-zinc-50">
              Server subscriptions
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {subscriptions.length} connected provider
              {subscriptions.length === 1 ? "" : "s"} with server-side quota
              snapshots.
            </p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {subscriptions.length === 0 ? (
            <div className="py-12">
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                No subscriptions connected
              </p>
              <p className="mt-1 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
                Add a provider below to start collecting quota snapshots for remote
                clients.
              </p>
            </div>
          ) : (
            subscriptions.map((subscription) => (
              <SubscriptionRow
                key={subscription.id}
                pendingAction={pendingAction}
                subscription={subscription}
                onDelete={deleteSubscription}
                onRefresh={refreshSubscription}
              />
            ))
          )}
        </div>
      </section>

      <form
        onSubmit={createSubscription}
        className="border-t border-zinc-200 pt-6 dark:border-zinc-800"
      >
        <div className="max-w-2xl">
          <h2 className="text-base font-medium text-zinc-950 dark:text-zinc-50">
            Connect provider
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Credentials stay encrypted on this server and are used only for quota
            refreshes.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Provider
            </span>
            <select
              value={selectedProviderId}
              onChange={(event) => {
                setSelectedProviderId(event.target.value);
                setCredentialValues({});
              }}
              className="mt-2 w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 dark:border-zinc-700 dark:bg-black dark:text-zinc-50 dark:focus:border-zinc-100"
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Display name
            </span>
            <input
              value={customTitle}
              onChange={(event) => setCustomTitle(event.target.value)}
              placeholder={selectedProvider?.displayName}
              className="mt-2 w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 dark:border-zinc-700 dark:bg-black dark:text-zinc-50 dark:focus:border-zinc-100"
            />
          </label>

          {selectedProvider?.credentialFields.map((field) => (
            <label key={field.key} className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {field.label}
              </span>
              <input
                type={field.isSecret ? "password" : "text"}
                required={field.isRequired}
                value={credentialValues[field.key] ?? ""}
                onChange={(event) =>
                  setCredentialValues((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                className="mt-2 w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 dark:border-zinc-700 dark:bg-black dark:text-zinc-50 dark:focus:border-zinc-100"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={!selectedProvider || pendingAction === "create"}
            className="inline-flex items-center justify-center gap-2 bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {pendingAction === "create" ? "Connecting..." : "Connect provider"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SubscriptionRow({
  pendingAction,
  subscription,
  onDelete,
  onRefresh,
}: {
  pendingAction: string | null;
  subscription: QuotaSubscription;
  onDelete: (subscriptionId: string) => void;
  onRefresh: (subscriptionId: string) => void;
}) {
  const resources = subscription.snapshot?.resources ?? [];

  return (
    <article className="py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-medium text-zinc-950 dark:text-zinc-50">
              {subscription.displayTitle}
            </h3>
            <StatusBadge state={subscription.syncState} />
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {subscription.providerDisplayName}
            {subscription.lastSyncedAt
              ? ` · synced ${formatDateTime(subscription.lastSyncedAt)}`
              : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRefresh(subscription.id)}
            disabled={pendingAction === `refresh:${subscription.id}`}
            className="inline-flex items-center justify-center gap-2 border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {pendingAction === `refresh:${subscription.id}` ? "Refreshing" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(subscription.id)}
            disabled={pendingAction === `delete:${subscription.id}`}
            className="inline-flex items-center justify-center gap-2 border border-red-200 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {pendingAction === `delete:${subscription.id}` ? "Deleting" : "Delete"}
          </button>
        </div>
      </div>

      {resources.length > 0 ? (
        <div className="mt-5 divide-y divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-900 dark:border-zinc-900">
          {resources.map((resource) => (
            <ResourceUsage key={resource.key} resource={resource} />
          ))}
        </div>
      ) : (
        <p className="mt-5 border-t border-zinc-100 pt-5 text-sm text-zinc-500 dark:border-zinc-900 dark:text-zinc-400">
          No quota snapshot is available yet. Refresh this subscription to fetch the
          latest provider state.
        </p>
      )}
    </article>
  );
}

function ResourceUsage({ resource }: { resource: QuotaResource }) {
  return (
    <div className="grid gap-3 py-4 lg:grid-cols-[minmax(180px,240px)_1fr]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {resource.title}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {resource.type}
          {resource.role ? ` · ${resource.role.toLowerCase()}` : ""}
        </p>
      </div>

      <div className="space-y-3">
        {resource.windows.map((window) => (
          <QuotaWindowUsage
            key={`${resource.key}:${window.windowKey}`}
            window={window}
          />
        ))}
      </div>
    </div>
  );
}

function QuotaWindowUsage({ window }: { window: QuotaWindow }) {
  const usage = quotaUsage(window);

  return (
    <div>
      <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline">
        <div className="min-w-0">
          <p className="truncate text-sm text-zinc-700 dark:text-zinc-300">
            {window.label ?? window.scope}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {window.resetAtEpochMillis
              ? `Resets ${formatDateTime(window.resetAtEpochMillis)}`
              : "No reset window reported"}
          </p>
        </div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {usage
            ? `${formatQuantity(usage.used, window.unit)} / ${formatQuantity(
                usage.total,
                window.unit,
              )}`
            : formatOpenUsage(window)}
        </p>
      </div>

      {usage ? (
        <>
          <div className="mt-2 h-2 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            <div
              className={`h-full ${progressFillClass(usage.percent)}`}
              style={{ width: `${usage.percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            {formatQuantity(usage.remaining, window.unit)} remaining
          </p>
        </>
      ) : null}
    </div>
  );
}

function StatusBadge({ state }: { state: QuotaSubscription["syncState"] }) {
  return (
    <span className={`border px-2 py-0.5 text-xs ${statusClassName(state)}`}>
      {state.replace("_", " ")}
    </span>
  );
}

function quotaUsage(window: QuotaWindow) {
  if (window.total == null || window.total <= 0) return null;

  const used =
    window.used ??
    (window.remaining == null ? null : Math.max(window.total - window.remaining, 0));
  if (used == null) return null;

  const remaining =
    window.remaining ?? Math.max(window.total - Math.min(used, window.total), 0);
  const percent = clamp(Math.round((used / window.total) * 100), 0, 100);

  return {
    percent,
    remaining,
    total: window.total,
    used,
  };
}

function formatOpenUsage(window: QuotaWindow) {
  if (window.used != null) {
    return `${formatQuantity(window.used, window.unit)} used`;
  }

  if (window.remaining != null) {
    return `${formatQuantity(window.remaining, window.unit)} remaining`;
  }

  return "-";
}

function formatQuantity(value: number, unit: QuotaWindow["unit"]) {
  const normalizedUnit = unit.toLowerCase();
  if (unit === "Percent") return `${value}%`;

  return `${value.toLocaleString()} ${normalizedUnit}${value === 1 ? "" : "s"}`;
}

function formatDateTime(value: number) {
  return new Date(value).toLocaleString();
}

function statusClassName(state: QuotaSubscription["syncState"]) {
  if (state === "active") {
    return "border-emerald-200 text-emerald-700 dark:border-emerald-950 dark:text-emerald-300";
  }

  if (state === "pending") {
    return "border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400";
  }

  return "border-red-200 text-red-700 dark:border-red-950 dark:text-red-300";
}

function progressFillClass(percent: number) {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 70) return "bg-amber-500";

  return "bg-zinc-950 dark:bg-zinc-50";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

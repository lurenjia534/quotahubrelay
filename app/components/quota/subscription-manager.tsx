"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Check,
  Database,
  Layers3,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  ProviderDescriptor,
  QuotaResource,
  QuotaSubscription,
  QuotaWindow,
} from "@/app/lib/quota/types";
import {
  MaterialAlert,
  MaterialBadge,
  MaterialButton,
  MaterialLinearProgressIndicator,
  MaterialTextField,
} from "@/app/components/material/primitives";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
      {message ? (
        <MaterialAlert
          variant={message.toLowerCase().includes("failed") ? "error" : "success"}
        >
          {message}
        </MaterialAlert>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0">
          <div className="grid gap-4 border-b border-outline-variant pb-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="flex min-w-0 gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-[var(--md-sys-shape-corner-large)] bg-primary-container text-on-primary-container">
                <Database className="size-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="md-headline-small md-emphasized text-on-surface">
                  Server subscriptions
                </h2>
                <p className="mt-1 md-body-medium text-on-surface-variant">
                  {subscriptions.length} connected provider
                  {subscriptions.length === 1 ? "" : "s"} with quota snapshots.
                </p>
              </div>
            </div>
            <MaterialBadge variant="primary">
              {subscriptions.length} total
            </MaterialBadge>
          </div>

          <div className="divide-y divide-outline-variant">
            {subscriptions.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                  <Layers3 className="size-6" aria-hidden="true" />
                </div>
                <h3 className="md-title-large md-emphasized text-on-surface">
                  No subscriptions connected
                </h3>
                <p className="mx-auto mt-2 max-w-md md-body-medium text-on-surface-variant">
                  Add a provider to collect quota snapshots for remote clients.
                </p>
              </div>
            ) : (
              subscriptions.map((subscription) => (
                <SubscriptionItem
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

        <aside className="xl:sticky xl:top-28 xl:self-start xl:border-l xl:border-outline-variant xl:pl-8">
          <div className="mb-5 flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-[var(--md-sys-shape-corner-large)] bg-tertiary-container text-on-tertiary-container">
              <Plus className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="md-headline-small md-emphasized text-on-surface">
                Connect provider
              </h2>
              <p className="mt-1 md-body-medium text-on-surface-variant">
                Credentials stay encrypted on this server.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <p className="md-label-large md-emphasized text-on-surface">
                Provider
              </p>
              <p className="md-label-medium text-on-surface-variant">
                {providers.length} available
              </p>
            </div>
            <div className="overflow-hidden rounded-[var(--md-sys-shape-corner-extra-large)] bg-surface-container-low">
              {providers.map((provider) => {
                const isSelected = provider.id === selectedProviderId;
                const requiredCount = provider.credentialFields.filter(
                  (field) => field.isRequired,
                ).length;

                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => {
                      setSelectedProviderId(provider.id);
                      setCredentialValues({});
                    }}
                    aria-pressed={isSelected}
                    className={cn(
                      "md-state-layer flex min-h-16 w-full items-center gap-3 border-b border-outline-variant px-3 text-left last:border-b-0",
                      "transition-colors duration-300 ease-[var(--md-sys-motion-easing-standard)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25",
                      isSelected
                        ? "bg-primary-container text-on-primary-container"
                        : "text-on-surface",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-full md-label-large md-emphasized",
                        isSelected
                          ? "bg-primary text-on-primary"
                          : "bg-surface text-on-surface-variant",
                      )}
                      aria-hidden="true"
                    >
                      {providerInitials(provider.displayName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate md-title-small md-emphasized">
                        {provider.displayName}
                      </span>
                      <span className="block md-body-small opacity-80">
                        {requiredCount === 0
                          ? "No credentials required"
                          : `${requiredCount} credential${requiredCount === 1 ? "" : "s"} required`}
                      </span>
                    </span>
                    {isSelected ? (
                      <Check className="size-5 shrink-0" aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedProvider ? (
            <form onSubmit={createSubscription} className="mt-6 space-y-4">
              <MaterialTextField
                label="Display name"
                value={customTitle}
                onChange={(event) => setCustomTitle(event.target.value)}
                placeholder={selectedProvider.displayName}
              />

              {selectedProvider.credentialFields.map((field) => (
                <MaterialTextField
                  key={field.key}
                  label={field.label}
                  type={field.isSecret ? "password" : "text"}
                  required={field.isRequired}
                  value={credentialValues[field.key] ?? ""}
                  onChange={(event) =>
                    setCredentialValues((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              ))}

              <MaterialButton
                type="submit"
                size="lg"
                className="w-full"
                disabled={pendingAction === "create"}
              >
                <Plus className="size-5" aria-hidden="true" />
                {pendingAction === "create" ? "Connecting..." : "Connect provider"}
              </MaterialButton>
            </form>
          ) : (
            <div className="mt-6 border-t border-outline-variant py-6 text-center">
              <p className="md-body-medium text-on-surface-variant">
                Select a provider to enter credentials.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function SubscriptionItem({
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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 truncate md-title-large md-emphasized text-on-surface">
              {subscription.displayTitle}
            </h3>
            <StatusBadge state={subscription.syncState} />
          </div>
          <p className="mt-1 md-body-medium text-on-surface-variant">
            {subscription.providerDisplayName}
            {subscription.lastSyncedAt
              ? ` · synced ${formatDateTime(subscription.lastSyncedAt)}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <MaterialButton
            variant="outlined"
            size="sm"
            onClick={() => onRefresh(subscription.id)}
            disabled={pendingAction === `refresh:${subscription.id}`}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {pendingAction === `refresh:${subscription.id}` ? "Refreshing" : "Refresh"}
          </MaterialButton>
          <MaterialButton
            variant="danger"
            size="sm"
            onClick={() => onDelete(subscription.id)}
            disabled={pendingAction === `delete:${subscription.id}`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {pendingAction === `delete:${subscription.id}` ? "Deleting" : "Delete"}
          </MaterialButton>
        </div>
      </div>

      {resources.length > 0 ? (
        <div className="mt-5 divide-y divide-outline-variant overflow-hidden rounded-[var(--md-sys-shape-corner-extra-large)] bg-surface-container-low">
          {resources.map((resource) => (
            <ResourceUsage key={resource.key} resource={resource} />
          ))}
        </div>
      ) : (
        <p className="mt-5 border-l-4 border-outline-variant bg-surface-container-low px-4 py-3 md-body-medium text-on-surface-variant">
          No quota snapshot is available yet. Refresh this subscription to fetch
          the latest provider state.
        </p>
      )}
    </article>
  );
}

function ResourceUsage({ resource }: { resource: QuotaResource }) {
  return (
    <div className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(160px,240px)_1fr]">
      <div className="min-w-0">
        <h4 className="truncate md-title-small md-emphasized text-on-surface">
          {resource.title}
        </h4>
        <p className="mt-1 md-body-small text-on-surface-variant">
          {resource.type}
          {resource.role ? ` · ${resource.role.toLowerCase()}` : ""}
        </p>
      </div>

      <div className="space-y-4">
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
  const percent = usage?.percent ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate md-label-large md-emphasized text-on-surface">
            {window.label ?? window.scope}
          </p>
          <p className="mt-1 md-body-small text-on-surface-variant">
            {window.resetAtEpochMillis
              ? `Resets ${formatDateTime(window.resetAtEpochMillis)}`
              : "No reset window reported"}
          </p>
        </div>
        <p className="md-label-large md-emphasized text-on-surface">
          {usage
            ? `${formatQuantity(usage.used, window.unit)} / ${formatQuantity(
                usage.total,
                window.unit,
              )}`
            : formatOpenUsage(window)}
        </p>
      </div>

      <MaterialLinearProgressIndicator
        className="mt-3"
        label={window.label ?? window.scope}
        value={percent}
        variant={progressVariant(percent)}
      />

      {usage ? (
        <p className="mt-1 md-body-small text-on-surface-variant">
          {formatQuantity(usage.remaining, window.unit)} remaining
        </p>
      ) : null}
    </div>
  );
}

function StatusBadge({ state }: { state: QuotaSubscription["syncState"] }) {
  const variant =
    state === "active" ? "success" : state === "pending" ? "outline" : "error";

  return (
    <MaterialBadge variant={variant} className="capitalize">
      {state.replace("_", " ")}
    </MaterialBadge>
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

function progressVariant(percent: number) {
  if (percent >= 90) return "error";
  if (percent >= 70) return "tertiary";
  return "primary";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function providerInitials(displayName: string) {
  const words = displayName
    .split(/[\s.\-_]+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[1][0]).toUpperCase();
}

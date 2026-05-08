"use client";

import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="border-t pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-medium text-foreground">
              Server subscriptions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {subscriptions.length} connected provider
              {subscriptions.length === 1 ? "" : "s"} with server-side quota
              snapshots.
            </p>
          </div>
        </div>

        <div className="mt-5 divide-y border-y">
          {subscriptions.length === 0 ? (
            <div className="py-12">
              <p className="text-sm font-medium text-foreground">
                No subscriptions connected
              </p>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
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
        className="border-t pt-6"
      >
        <div className="max-w-2xl">
          <h2 className="text-base font-medium text-foreground">
            Connect provider
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Credentials stay encrypted on this server and are used only for quota
            refreshes.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={selectedProviderId}
              onValueChange={(value) => {
                setSelectedProviderId(value ?? "");
                setCredentialValues({});
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription-title">Display name</Label>
            <Input
              id="subscription-title"
              value={customTitle}
              onChange={(event) => setCustomTitle(event.target.value)}
              placeholder={selectedProvider?.displayName}
            />
          </div>

          {selectedProvider?.credentialFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`credential-${field.key}`}>{field.label}</Label>
              <Input
                id={`credential-${field.key}`}
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
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="submit"
            disabled={!selectedProvider || pendingAction === "create"}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {pendingAction === "create" ? "Connecting..." : "Connect provider"}
          </Button>
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
            <h3 className="truncate text-base font-medium text-foreground">
              {subscription.displayTitle}
            </h3>
            <StatusBadge state={subscription.syncState} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {subscription.providerDisplayName}
            {subscription.lastSyncedAt
              ? ` · synced ${formatDateTime(subscription.lastSyncedAt)}`
              : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefresh(subscription.id)}
            disabled={pendingAction === `refresh:${subscription.id}`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {pendingAction === `refresh:${subscription.id}` ? "Refreshing" : "Refresh"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(subscription.id)}
            disabled={pendingAction === `delete:${subscription.id}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {pendingAction === `delete:${subscription.id}` ? "Deleting" : "Delete"}
          </Button>
        </div>
      </div>

      {resources.length > 0 ? (
        <div className="mt-5 divide-y border-t">
          {resources.map((resource) => (
            <ResourceUsage key={resource.key} resource={resource} />
          ))}
        </div>
      ) : (
        <p className="mt-5 border-t pt-5 text-sm text-muted-foreground">
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
        <p className="truncate text-sm font-medium text-foreground">
          {resource.title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
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
          <p className="truncate text-sm text-foreground">
            {window.label ?? window.scope}
          </p>
          <p className="text-xs text-muted-foreground">
            {window.resetAtEpochMillis
              ? `Resets ${formatDateTime(window.resetAtEpochMillis)}`
              : "No reset window reported"}
          </p>
        </div>
        <p className="text-sm font-medium text-foreground">
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
          <Progress value={usage.percent} className="mt-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {formatQuantity(usage.remaining, window.unit)} remaining
          </p>
        </>
      ) : null}
    </div>
  );
}

function StatusBadge({ state }: { state: QuotaSubscription["syncState"] }) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", statusClassName(state))}
    >
      {state.replace("_", " ")}
    </Badge>
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
    return "border-emerald-200 text-emerald-700";
  }

  if (state === "pending") {
    return "text-muted-foreground";
  }

  return "border-destructive/30 text-destructive";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

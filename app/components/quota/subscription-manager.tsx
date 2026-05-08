"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  ProviderDescriptor,
  QuotaResource,
  QuotaSubscription,
  QuotaWindow,
} from "@/app/lib/quota/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import {
  Progress,
  ProgressLabel,
} from "@/components/ui/progress";
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
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Server subscriptions</CardTitle>
          <CardDescription>
            {subscriptions.length} connected provider
            {subscriptions.length === 1 ? "" : "s"} with server-side quota
            snapshots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemGroup className="gap-0 divide-y rounded-lg border">
            {subscriptions.length === 0 ? (
              <Item className="rounded-none border-0 px-4 py-10" role="listitem">
                <ItemContent>
                  <ItemTitle>No subscriptions connected</ItemTitle>
                  <ItemDescription>
                    Add a provider below to start collecting quota snapshots for
                    remote clients.
                  </ItemDescription>
                </ItemContent>
              </Item>
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
          </ItemGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connect a provider</CardTitle>
          <CardDescription>
            Pick a provider, then enter the credentials needed to fetch quota
            snapshots. Secrets stay encrypted on this server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-foreground">
                1. Choose provider
              </p>
              <p className="text-xs text-muted-foreground">
                {providers.length} available
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      "group relative flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-all",
                      "hover:border-foreground/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "border-foreground ring-2 ring-foreground/10"
                        : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold",
                        isSelected
                          ? "bg-foreground text-background"
                          : "bg-muted text-foreground/70 group-hover:bg-muted/80",
                      )}
                      aria-hidden="true"
                    >
                      {providerInitials(provider.displayName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {provider.displayName}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {requiredCount === 0
                          ? "No credentials required"
                          : `${requiredCount} credential${requiredCount === 1 ? "" : "s"} required`}
                      </span>
                    </span>
                    {isSelected ? (
                      <Check
                        className="h-4 w-4 shrink-0 text-foreground"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedProvider ? (
            <form onSubmit={createSubscription} className="space-y-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-foreground">
                  2. Configure {selectedProvider.displayName}
                </p>
              </div>
              <FieldGroup className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="subscription-title">
                    Display name
                  </FieldLabel>
                  <Input
                    id="subscription-title"
                    value={customTitle}
                    onChange={(event) => setCustomTitle(event.target.value)}
                    placeholder={selectedProvider.displayName}
                  />
                </Field>

                {selectedProvider.credentialFields.map((field) => (
                  <Field key={field.key}>
                    <FieldLabel htmlFor={`credential-${field.key}`}>
                      {field.label}
                    </FieldLabel>
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
                  </Field>
                ))}

                <div className="flex justify-end md:col-span-2">
                  <Button
                    type="submit"
                    disabled={pendingAction === "create"}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {pendingAction === "create"
                      ? "Connecting..."
                      : "Connect provider"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Select a provider above to enter credentials.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
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
    <Item
      className="block rounded-none border-0 px-4 py-5"
      role="listitem"
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <ItemContent className="min-w-0">
          <ItemTitle className="max-w-full">
            <span className="truncate">{subscription.displayTitle}</span>
            <StatusBadge state={subscription.syncState} />
          </ItemTitle>
          <ItemDescription>
            {subscription.providerDisplayName}
            {subscription.lastSyncedAt
              ? ` · synced ${formatDateTime(subscription.lastSyncedAt)}`
              : ""}
          </ItemDescription>
        </ItemContent>

        <ItemActions className="justify-start sm:justify-end">
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
        </ItemActions>
      </div>

      {resources.length > 0 ? (
        <ItemGroup className="mt-5 gap-0 divide-y border-t">
          {resources.map((resource) => (
            <ResourceUsage key={resource.key} resource={resource} />
          ))}
        </ItemGroup>
      ) : (
        <p className="mt-5 border-t pt-5 text-sm text-muted-foreground">
          No quota snapshot is available yet. Refresh this subscription to fetch
          the latest provider state.
        </p>
      )}
    </Item>
  );
}

function ResourceUsage({ resource }: { resource: QuotaResource }) {
  return (
    <Item
      className="grid rounded-none border-0 px-0 py-3 lg:grid-cols-[minmax(180px,240px)_1fr] lg:items-start"
      role="listitem"
    >
      <ItemContent className="min-w-0">
        <ItemTitle>{resource.title}</ItemTitle>
        <ItemDescription>
          {resource.type}
          {resource.role ? ` · ${resource.role.toLowerCase()}` : ""}
        </ItemDescription>
      </ItemContent>

      <div className="w-full space-y-3">
        {resource.windows.map((window) => (
          <QuotaWindowUsage
            key={`${resource.key}:${window.windowKey}`}
            window={window}
          />
        ))}
      </div>
    </Item>
  );
}

function QuotaWindowUsage({ window }: { window: QuotaWindow }) {
  const usage = quotaUsage(window);

  return (
    <Progress value={usage?.percent ?? 0}>
      <ProgressLabel>
        <span className="block truncate text-sm font-normal text-foreground">
          {window.label ?? window.scope}
        </span>
        <span className="block text-xs font-normal text-muted-foreground">
          {window.resetAtEpochMillis
            ? `Resets ${formatDateTime(window.resetAtEpochMillis)}`
            : "No reset window reported"}
        </span>
      </ProgressLabel>
      <p className="ml-auto text-sm font-medium text-foreground">
        {usage
          ? `${formatQuantity(usage.used, window.unit)} / ${formatQuantity(
              usage.total,
              window.unit,
            )}`
          : formatOpenUsage(window)}
      </p>
      {usage ? (
        <p className="basis-full text-xs text-muted-foreground">
          {formatQuantity(usage.remaining, window.unit)} remaining
        </p>
      ) : null}
    </Progress>
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

function providerInitials(displayName: string) {
  const words = displayName
    .split(/[\s.\-_]+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[1][0]).toUpperCase();
}

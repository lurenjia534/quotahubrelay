"use client";

import * as motion from "motion/react-client";
import { ArrowRight, Gauge } from "lucide-react";
import {
  QuotaResource,
  QuotaSubscription,
  QuotaWindow,
} from "@/app/lib/quota/types";
import {
  MaterialBadge,
  MaterialLinearProgressIndicator,
} from "@/app/components/material/primitives";
import {
  expressiveListItem,
} from "@/app/components/material/motion";
import { cn } from "@/lib/utils";

export type SubscriptionSummary = {
  highestUsagePercent: number | null;
  resourceCount: number;
  riskLabel: "No snapshot" | "Ready" | "Watch" | "Limit soon";
  riskVariant: "outline" | "success" | "warning" | "error";
  sampledResources: QuotaResource[];
  windowCount: number;
};

export function getSubscriptionSummary(
  subscription: QuotaSubscription,
): SubscriptionSummary {
  const resources = subscription.snapshot?.resources ?? [];
  const usages = resources.flatMap((resource) =>
    resource.windows
      .map((window) => quotaUsage(window))
      .filter((usage): usage is NonNullable<ReturnType<typeof quotaUsage>> =>
        Boolean(usage),
      ),
  );
  const highestUsagePercent =
    usages.length === 0
      ? null
      : usages.reduce((highest, usage) => Math.max(highest, usage.percent), 0);

  const riskLabel =
    highestUsagePercent == null
      ? subscription.snapshot
        ? "Ready"
        : "No snapshot"
      : highestUsagePercent >= 90
        ? "Limit soon"
        : highestUsagePercent >= 70
          ? "Watch"
          : "Ready";

  const riskVariant =
    riskLabel === "Limit soon"
      ? "error"
      : riskLabel === "Watch"
        ? "warning"
        : riskLabel === "Ready"
          ? "success"
          : "outline";

  return {
    highestUsagePercent,
    resourceCount: resources.length,
    riskLabel,
    riskVariant,
    sampledResources: resources.slice(0, 4),
    windowCount: resources.reduce(
      (total, resource) => total + resource.windows.length,
      0,
    ),
  };
}

export function SubscriptionStatusBadge({
  state,
}: {
  state: QuotaSubscription["syncState"];
}) {
  const variant =
    state === "active" ? "success" : state === "pending" ? "outline" : "error";

  return (
    <MaterialBadge variant={variant} className="capitalize">
      {state.replace("_", " ")}
    </MaterialBadge>
  );
}

export function SummaryProgress({
  summary,
}: {
  summary: SubscriptionSummary;
}) {
  const value = summary.highestUsagePercent ?? 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="md-label-large text-on-surface-variant">
          Highest usage
        </p>
        <p className="md-label-large md-emphasized text-on-surface">
          {summary.highestUsagePercent == null
            ? "Not reported"
            : `${summary.highestUsagePercent}%`}
        </p>
      </div>
      <MaterialLinearProgressIndicator
        label="Highest usage"
        value={value}
        variant={progressVariant(value)}
      />
    </div>
  );
}

export function ResourcePreviewChips({
  resources,
  total,
}: {
  resources: QuotaResource[];
  total: number;
}) {
  if (total === 0) {
    return (
      <p className="md-body-medium text-on-surface-variant">
        No resources have been captured yet.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {resources.map((resource) => (
        <span
          key={resource.key}
          className="rounded-full bg-surface-container px-3 py-1 md-label-medium text-on-surface-variant"
        >
          {resource.title}
        </span>
      ))}
      {total > resources.length ? (
        <span className="rounded-full bg-surface-container-high px-3 py-1 md-label-medium text-on-surface">
          +{total - resources.length}
        </span>
      ) : null}
    </div>
  );
}

export function QuotaResourceUsage({ resource }: { resource: QuotaResource }) {
  return (
    <motion.div
      layout
      className="grid gap-4 px-1 py-5 lg:grid-cols-[minmax(180px,260px)_1fr]"
      variants={expressiveListItem}
    >
      <div className="min-w-0">
        <h4 className="truncate md-title-medium md-emphasized text-on-surface">
          {resource.title}
        </h4>
        <p className="mt-1 md-body-medium text-on-surface-variant">
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
    </motion.div>
  );
}

export function DetailCallout({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string | number;
}) {
  return (
    <div
      className={cn(
        "min-w-0 px-1 py-3 sm:px-4",
        className,
      )}
    >
      <p className="md-label-large text-on-surface-variant">{label}</p>
      <p className="mt-1 md-title-large md-emphasized text-on-surface">
        {value}
      </p>
    </div>
  );
}

export function OpenDetailsHint() {
  return (
    <span className="md-state-layer inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 md-label-large md-emphasized text-on-primary">
      Details
      <ArrowRight className="size-4" aria-hidden="true" />
    </span>
  );
}

export function SummaryGlyph() {
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-[var(--md-sys-shape-corner-large-increased)] bg-secondary-container text-on-secondary-container">
      <Gauge className="size-6" aria-hidden="true" />
    </span>
  );
}

function QuotaWindowUsage({ window }: { window: QuotaWindow }) {
  const usage = quotaUsage(window);
  const percent = usage?.percent ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate md-title-small md-emphasized text-on-surface">
            {window.label ?? window.scope}
          </p>
          <p className="mt-1 md-body-medium text-on-surface-variant">
            {window.resetAtEpochMillis
              ? `Resets ${formatDateTime(window.resetAtEpochMillis)}`
              : "No reset window reported"}
          </p>
        </div>
        <p className="md-title-small md-emphasized text-on-surface">
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
        <p className="mt-1 md-body-medium text-on-surface-variant">
          {formatQuantity(usage.remaining, window.unit)} remaining
        </p>
      ) : null}
    </div>
  );
}

export function quotaUsage(window: QuotaWindow) {
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

export function formatQuantity(value: number, unit: QuotaWindow["unit"]) {
  const normalizedUnit = unit.toLowerCase();
  if (unit === "Percent") return `${value}%`;

  return `${value.toLocaleString()} ${normalizedUnit}${value === 1 ? "" : "s"}`;
}

export function formatDateTime(value: number) {
  return new Date(value).toLocaleString();
}

export function progressVariant(percent: number) {
  if (percent >= 90) return "error";
  if (percent >= 70) return "tertiary";
  return "primary";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

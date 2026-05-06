import "server-only";

import {
  CapturedQuotaSnapshot,
  ProviderDescriptor,
  ProviderSyncError,
  QuotaResource,
  QuotaSnapshot,
  QuotaWindow,
  SecretBundle,
  quotaBuckets,
  quotaWindowLabels,
} from "@/app/lib/quota/types";

type Provider = {
  descriptor: ProviderDescriptor;
  rawPayloadFormat: string;
  normalizerVersion: number;
  validate(credentials: SecretBundle): Promise<CapturedQuotaSnapshot>;
};

export const providers: Provider[] = [
  {
    descriptor: {
      id: "codex",
      displayName: "OpenAI Codex",
      credentialFields: [
        {
          key: "accessToken",
          label: "Access Token",
          isSecret: true,
          isRequired: true,
        },
        {
          key: "accountId",
          label: "ChatGPT Account ID (optional)",
          isSecret: false,
          isRequired: false,
        },
      ],
    },
    rawPayloadFormat: "codex.usage-response.v1",
    normalizerVersion: 1,
    validate: validateCodex,
  },
  {
    descriptor: {
      id: "kimi",
      displayName: "Kimi Coding Plan",
      credentialFields: [
        { key: "apiKey", label: "API Key", isSecret: true, isRequired: true },
      ],
    },
    rawPayloadFormat: "kimi.coding-usage-response.v1",
    normalizerVersion: 1,
    validate: validateKimi,
  },
  {
    descriptor: {
      id: "minimax",
      displayName: "MiniMax Coding Plan",
      credentialFields: [
        { key: "apiKey", label: "API Key", isSecret: true, isRequired: true },
      ],
    },
    rawPayloadFormat: "minimax.quota-response.v1",
    normalizerVersion: 1,
    validate: validateMiniMax,
  },
  monitorProvider({
    id: "zai",
    displayName: "Z.ai",
    defaultBaseUrl: "https://api.z.ai/api/anthropic",
    rawPayloadFormat: "zai.monitor-usage-bundle.v1",
  }),
  monitorProvider({
    id: "zhipu",
    displayName: "Zhipu BigModel",
    defaultBaseUrl: "https://open.bigmodel.cn/api/anthropic",
    rawPayloadFormat: "zhipu.monitor-usage-bundle.v1",
  }),
];

export const providerDescriptors = providers.map((provider) => provider.descriptor);

export function providerById(providerId: string) {
  return providers.find((provider) => provider.descriptor.id === providerId) ?? null;
}

export function normalizeSecretBundle(value: unknown): SecretBundle {
  const rawValues = getRecord(getRecord(value).values ?? value);
  const values = Object.fromEntries(
    Object.entries(rawValues)
      .map(([key, rawValue]) => [key, typeof rawValue === "string" ? rawValue.trim() : ""])
      .filter(([, rawValue]) => rawValue.length > 0),
  );

  return { values };
}

export function requireCredentials(
  descriptor: ProviderDescriptor,
  credentials: SecretBundle,
) {
  for (const field of descriptor.credentialFields) {
    if (field.isRequired && !credentials.values[field.key]) {
      throw new ProviderSyncError(
        "validation",
        `Missing required credential: ${field.key}`,
        400,
      );
    }
  }
}

async function validateCodex(credentials: SecretBundle) {
  const fetchedAt = Date.now();
  const rawPayload = await fetchJson("https://chatgpt.com/backend-api/wham/usage", {
    headers: {
      Authorization: `Bearer ${requiredCredential(credentials, "accessToken")}`,
      ...optionalHeader("ChatGPT-Account-Id", credentials.values.accountId),
    },
  });
  const snapshot = codexToQuotaSnapshot(getRecord(rawPayload), fetchedAt);
  return captured(snapshot, fetchedAt, "codex.usage-response.v1", 1, rawPayload);
}

async function validateKimi(credentials: SecretBundle) {
  const fetchedAt = Date.now();
  const apiKey = requiredCredential(credentials, "apiKey");
  const authorization = apiKey.toLowerCase().startsWith("bearer ")
    ? apiKey
    : `Bearer ${apiKey}`;
  const rawPayload = await fetchJson("https://api.kimi.com/coding/v1/usages", {
    headers: { Authorization: authorization },
  });
  const snapshot = kimiToQuotaSnapshot(getRecord(rawPayload), fetchedAt);
  return captured(snapshot, fetchedAt, "kimi.coding-usage-response.v1", 1, rawPayload);
}

async function validateMiniMax(credentials: SecretBundle) {
  const fetchedAt = Date.now();
  const rawPayload = await fetchJson(
    "https://www.minimaxi.com/v1/api/openplatform/coding_plan/remains",
    {
      headers: { Authorization: `Bearer ${requiredCredential(credentials, "apiKey")}` },
    },
  );
  const snapshot = miniMaxToQuotaSnapshot(getRecord(rawPayload), fetchedAt);
  return captured(snapshot, fetchedAt, "minimax.quota-response.v1", 1, rawPayload);
}

function monitorProvider(config: {
  id: string;
  displayName: string;
  defaultBaseUrl: string;
  rawPayloadFormat: string;
}): Provider {
  return {
    descriptor: {
      id: config.id,
      displayName: config.displayName,
      credentialFields: [
        {
          key: "authToken",
          label: "Authorization Token",
          isSecret: true,
          isRequired: true,
        },
        {
          key: "baseUrl",
          label: "Base URL (optional)",
          isSecret: false,
          isRequired: false,
        },
      ],
    },
    rawPayloadFormat: config.rawPayloadFormat,
    normalizerVersion: 1,
    async validate(credentials) {
      const fetchedAt = Date.now();
      const baseUrl = monitorBaseUrl(credentials.values.baseUrl, config.defaultBaseUrl);
      const authorization = requiredCredential(credentials, "authToken");
      const usageWindow = monitorUsageWindow();
      const [modelUsage, toolUsage, quotaLimit] = await Promise.all([
        fetchJson(monitorUrl(baseUrl, "api/monitor/usage/model-usage", usageWindow), {
          headers: monitorHeaders(authorization),
        }),
        fetchJson(monitorUrl(baseUrl, "api/monitor/usage/tool-usage", usageWindow), {
          headers: monitorHeaders(authorization),
        }),
        fetchJson(monitorUrl(baseUrl, "api/monitor/usage/quota/limit"), {
          headers: monitorHeaders(authorization),
        }),
      ]);
      const rawPayload = { modelUsage, toolUsage, quotaLimit };
      const snapshot = monitorToQuotaSnapshot(
        getRecord(modelUsage),
        getRecord(toolUsage),
        getRecord(quotaLimit),
        fetchedAt,
      );

      return captured(snapshot, fetchedAt, config.rawPayloadFormat, 1, rawPayload);
    },
  };
}

async function fetchJson(url: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "QuotaHubRelay/0.1",
        ...init.headers,
      },
    });
  } catch (error) {
    throw new ProviderSyncError(
      "transient",
      error instanceof Error ? error.message : "Provider request failed.",
    );
  }

  const text = await response.text();
  const body = text ? safeJson(text) : null;
  if (!response.ok) {
    const message = providerErrorMessage(body) ?? response.statusText;
    throw new ProviderSyncError(httpFailureType(response.status), message, response.status);
  }

  return body;
}

function codexToQuotaSnapshot(raw: Record<string, unknown>, fetchedAt: number): QuotaSnapshot {
  const resources: QuotaResource[] = [];
  const rateLimit = getOptionalRecord(raw.rate_limit);
  if (rateLimit) {
    const resource = codexRateLimitToResource(
      rateLimit,
      "codex",
      primaryCodexTitle(getOptionalString(raw.plan_type)),
      "Plan",
    );
    if (resource) resources.push(resource);
  }

  getArray(raw.additional_rate_limits).forEach((value, index) => {
    const additional = getRecord(value);
    const meteredFeature =
      getOptionalString(additional.metered_feature)?.trim() || `codex-feature-${index + 1}`;
    const limit = getOptionalRecord(additional.rate_limit);
    if (!limit) return;
    const resource = codexRateLimitToResource(
      limit,
      meteredFeature,
      getOptionalString(additional.limit_name)?.trim() || toDisplayTitle(meteredFeature),
      "Feature",
    );
    if (resource) resources.push(resource);
  });

  return { fetchedAt, resources };
}

function codexRateLimitToResource(
  raw: Record<string, unknown>,
  key: string,
  title: string,
  type: "Plan" | "Feature",
): QuotaResource | null {
  const windows = [
    codexWindow(getOptionalRecord(raw.primary_window), "primary"),
    codexWindow(getOptionalRecord(raw.secondary_window), "secondary"),
  ].filter((window): window is QuotaWindow => Boolean(window));

  if (windows.length === 0) return null;

  return {
    key,
    title,
    type,
    role: "Limit",
    bucket: type === "Plan" ? quotaBuckets.budget : key,
    windows,
  };
}

function codexWindow(raw: Record<string, unknown> | null, windowKey: string): QuotaWindow | null {
  if (!raw) return null;
  const usedPercent = clamp(Math.round(getNumber(raw.used_percent) ?? 0), 0, 100);
  const resetAt = getNumber(raw.reset_at);
  const resetAtMillis = resetAt == null ? null : resetAt * 1000;
  const durationSeconds = getNumber(raw.limit_window_seconds);
  const durationMillis = durationSeconds == null ? null : durationSeconds * 1000;
  return {
    windowKey,
    scope: durationSecondsToScope(durationSeconds),
    label:
      windowKey === "primary" ? quotaWindowLabels.primary : quotaWindowLabels.secondary,
    total: 100,
    used: usedPercent,
    remaining: 100 - usedPercent,
    resetAtEpochMillis: resetAtMillis,
    startsAt:
      resetAtMillis != null && durationMillis != null
        ? Math.max(resetAtMillis - durationMillis, 0)
        : null,
    endsAt: resetAtMillis,
    unit: "Percent",
  };
}

function kimiToQuotaSnapshot(raw: Record<string, unknown>, fetchedAt: number): QuotaSnapshot {
  const usage = getRecord(raw.usage);
  const totalQuota = getOptionalRecord(raw.totalQuota);
  const totalSummary = totalQuota
    ? {
        limit: getString(totalQuota.limit),
        remaining: getString(totalQuota.remaining),
        resetTime: getString(usage.resetTime),
      }
    : {
        limit: getString(usage.limit),
        remaining: getString(usage.remaining),
        resetTime: getString(usage.resetTime),
      };
  const resources: QuotaResource[] = [
    {
      key: "coding-plan",
      title: "Total plan quota",
      type: "Plan",
      role: "Anchor",
      bucket: quotaBuckets.modelCalls,
      windows: [kimiSummaryWindow(totalSummary, "total", "Rolling", "Purchased plan", null)],
    },
  ];

  getArray(raw.limits).forEach((value, index) => {
    const limit = getRecord(value);
    const window = getRecord(limit.window);
    const detail = getRecord(limit.detail);
    const resetAt = parseIsoMillis(getString(detail.resetTime));
    resources.push({
      key: `quota-window:${index}`,
      title: `${kimiWindowLabel(window)} window`,
      type: "Plan",
      role: "Limit",
      bucket: quotaBuckets.modelCalls,
      windows: [
        kimiSummaryWindow(
          {
            limit: getString(detail.limit),
            remaining: getString(detail.remaining),
            resetTime: getString(detail.resetTime),
          },
          `window-${index}`,
          kimiWindowScope(window),
          kimiWindowLabel(window),
          resetAt == null ? null : kimiWindowStart(resetAt, window),
        ),
      ],
    });
  });

  const parallel = getOptionalRecord(raw.parallel);
  if (parallel) {
    const parallelLimit = nonNegativeLong(getString(parallel.limit), "parallel limit");
    resources.push({
      key: "parallel",
      title: "Parallel capacity",
      type: "Feature",
      role: "Anchor",
      bucket: "parallel",
      windows: [
        {
          windowKey: "current",
          scope: "Rolling",
          label: quotaWindowLabels.current,
          total: parallelLimit,
          used: null,
          remaining: parallelLimit,
          resetAtEpochMillis: null,
          unit: "Request",
        },
      ],
    });
  }

  return { fetchedAt, resources };
}

function kimiSummaryWindow(
  summary: { limit: string; remaining: string; resetTime: string },
  windowKey: string,
  scope: QuotaWindow["scope"],
  label: string,
  startsAt: number | null,
): QuotaWindow {
  const total = nonNegativeLong(summary.limit, "limit");
  const remaining = nonNegativeLong(summary.remaining, "remaining");
  const resetAt = parseIsoMillis(summary.resetTime);
  return {
    windowKey,
    scope,
    label,
    total,
    used: Math.max(total - remaining, 0),
    remaining,
    resetAtEpochMillis: resetAt,
    startsAt,
    endsAt: resetAt,
    unit: "Request",
  };
}

function miniMaxToQuotaSnapshot(raw: Record<string, unknown>, fetchedAt: number): QuotaSnapshot {
  const baseResp = getRecord(raw.base_resp);
  const statusCode = getNumber(baseResp.status_code);
  if (statusCode !== 0) {
    throw new ProviderSyncError(
      miniMaxFailureType(statusCode),
      getOptionalString(baseResp.status_msg) ||
        `MiniMax request failed with status code ${statusCode}.`,
    );
  }

  return {
    fetchedAt,
    resources: getArray(raw.model_remains).map((value) => {
      const quota = getRecord(value);
      const total = getNumber(quota.current_interval_total_count) ?? 0;
      const remaining = Math.max(getNumber(quota.current_interval_usage_count) ?? 0, 0);
      const weeklyTotal = getNumber(quota.current_weekly_total_count) ?? 0;
      const weeklyRemaining = Math.max(getNumber(quota.current_weekly_usage_count) ?? 0, 0);
      const modelName = getString(quota.model_name);
      const windows: QuotaWindow[] = [
        {
          windowKey: quotaWindowLabels.interval,
          scope: "Interval",
          label: quotaWindowLabels.interval,
          total,
          used: Math.max(total - remaining, 0),
          remaining,
          resetAtEpochMillis: positiveNumber(quota.end_time),
          startsAt: positiveNumber(quota.start_time),
          endsAt: positiveNumber(quota.end_time),
          unit: "Request",
        },
      ];
      if (weeklyTotal > 0) {
        windows.push({
          windowKey: quotaWindowLabels.weekly,
          scope: "Weekly",
          label: quotaWindowLabels.weekly,
          total: weeklyTotal,
          used: Math.max(weeklyTotal - weeklyRemaining, 0),
          remaining: weeklyRemaining,
          resetAtEpochMillis: positiveNumber(quota.weekly_end_time),
          startsAt: positiveNumber(quota.weekly_start_time),
          endsAt: positiveNumber(quota.weekly_end_time),
          unit: "Request",
        });
      }

      return {
        key: modelName,
        title: modelName,
        type: "Model",
        role: miniMaxAnchorKeys.has(modelName) ? "Anchor" : "Limit",
        bucket: quotaBuckets.modelCalls,
        windows,
      };
    }),
  };
}

function monitorToQuotaSnapshot(
  modelUsageEnvelope: Record<string, unknown>,
  toolUsageEnvelope: Record<string, unknown>,
  quotaLimitEnvelope: Record<string, unknown>,
  fetchedAt: number,
): QuotaSnapshot {
  const modelUsage = monitorData(modelUsageEnvelope, "model usage");
  const toolUsage = monitorData(toolUsageEnvelope, "tool usage");
  const quotaLimit = monitorData(quotaLimitEnvelope, "quota limit");
  const sampleWindow =
    sampleWindowFromTimes(getArray(modelUsage.x_time)) ??
    sampleWindowFromTimes(getArray(toolUsage.x_time));
  const resources: QuotaResource[] = [];

  getArray(quotaLimit.limits).forEach((value, index) => {
    const limit = getRecord(value);
    const resource = monitorLimitResource(limit, index);
    if (resource) resources.push(resource);
  });

  resources.push(...monitorModelResources(modelUsage, sampleWindow));
  resources.push(...monitorSampledToolResources(toolUsage, sampleWindow));
  getArray(quotaLimit.limits).forEach((value) => {
    resources.push(...monitorLimitDetailResources(getRecord(value)));
  });

  return { fetchedAt, resources };
}

function monitorModelResources(
  modelUsage: Record<string, unknown>,
  sampleWindow: SampleWindow | null,
): QuotaResource[] {
  const totalUsage = getOptionalRecord(modelUsage.totalUsage) ?? {};
  let summaries = getArray(modelUsage.modelSummaryList);
  if (summaries.length === 0) summaries = getArray(totalUsage.modelSummaryList);
  if (summaries.length === 0) {
    summaries = getArray(modelUsage.modelDataList).map((value) => {
      const model = getRecord(value);
      return {
        modelName: model.modelName,
        totalTokens: model.totalTokens,
        sortOrder: model.sortOrder,
      };
    });
  }

  return summaries
    .map(getRecord)
    .sort((left, right) => sortOrder(left) - sortOrder(right))
    .map((summary) => {
      const modelName = getString(summary.modelName);
      return {
        key: `model:${modelName}`,
        title: modelName,
        type: "Model",
        role: "Sampled",
        bucket: quotaBuckets.tokens,
        windows: [
          {
            windowKey: quotaWindowLabels.sampled,
            scope: "Rolling",
            label: quotaWindowLabels.sampled,
            total: null,
            used: getNumber(summary.totalTokens) ?? 0,
            remaining: null,
            resetAtEpochMillis: sampleWindow?.endsAt ?? null,
            startsAt: sampleWindow?.startsAt ?? null,
            endsAt: sampleWindow?.endsAt ?? null,
            unit: "Token",
          },
        ],
      };
    });
}

function monitorSampledToolResources(
  toolUsage: Record<string, unknown>,
  sampleWindow: SampleWindow | null,
): QuotaResource[] {
  const totalUsage = getOptionalRecord(toolUsage.totalUsage) ?? {};
  const metrics = [
    {
      key: "network-search",
      title: "Network search",
      usage: firstNonZero(
        getNumber(totalUsage.totalNetworkSearchCount) ?? 0,
        summarizedToolUsage(toolUsage, ["search-prime", "network-search"]),
      ),
    },
    {
      key: "web-reader",
      title: "Web Reader",
      usage: firstNonZero(
        getNumber(totalUsage.totalWebReadMcpCount) ?? 0,
        summarizedToolUsage(toolUsage, ["web-reader", "web-read"]),
      ),
    },
    {
      key: "zread",
      title: "ZRead MCP",
      usage: firstNonZero(
        getNumber(totalUsage.totalZreadMcpCount) ?? 0,
        summarizedToolUsage(toolUsage, ["zread"]),
      ),
    },
  ].filter((metric) => metric.usage > 0);

  return metrics.map((metric) => ({
    key: `tool-sampled:${metric.key}`,
    title: metric.title,
    type: "Feature",
    role: "Sampled",
    bucket: quotaBuckets.mcp,
    windows: [
      {
        windowKey: quotaWindowLabels.sampled,
        scope: "Rolling",
        label: quotaWindowLabels.sampled,
        total: null,
        used: metric.usage,
        remaining: null,
        resetAtEpochMillis: sampleWindow?.endsAt ?? null,
        startsAt: sampleWindow?.startsAt ?? null,
        endsAt: sampleWindow?.endsAt ?? null,
        unit: "Request",
      },
    ],
  }));
}

function monitorLimitResource(raw: Record<string, unknown>, index: number): QuotaResource | null {
  const normalizedType = getOptionalString(raw.type)?.trim();
  if (!normalizedType) return null;
  const usedPercent = clamp(
    Math.trunc(getNumber(raw.percentage) ?? getNumber(raw.currentValue) ?? 0),
    0,
    100,
  );
  const remainingPercent = clamp(
    Math.trunc(getNumber(raw.remaining) ?? 100 - usedPercent),
    0,
    100,
  );
  const resetAt = positiveNumber(raw.nextResetTime);
  return {
    key: `limit:${normalizedType.toLowerCase()}`,
    title: `${limitDisplayTitle(normalizedType)} (${monitorWindowLabel(raw)})`,
    type: "Plan",
    role: "Limit",
    bucket: monitorBucket(raw),
    windows: [
      {
        windowKey: `limit-${index}`,
        scope: monitorWindowScope(raw),
        label: monitorWindowLabel(raw),
        total: 100,
        used: usedPercent,
        remaining: remainingPercent,
        resetAtEpochMillis: resetAt,
        startsAt: resetAt == null ? null : monitorWindowStart(resetAt, raw),
        endsAt: resetAt,
        unit: "Percent",
      },
    ],
  };
}

function monitorLimitDetailResources(raw: Record<string, unknown>): QuotaResource[] {
  const resetAt = positiveNumber(raw.nextResetTime);
  return getArray(raw.usageDetails)
    .map(getRecord)
    .filter((detail) => (getNumber(detail.usage) ?? 0) > 0)
    .map((detail) => {
      const modelCode = getString(detail.modelCode);
      return {
        key: `tool-limit:${modelCode}`,
        title: toDisplayTitle(modelCode),
        type: "Feature",
        role: "Contributor",
        bucket: monitorBucket(raw),
        windows: [
          {
            windowKey: quotaWindowLabels.current,
            scope: monitorWindowScope(raw),
            label: quotaWindowLabels.current,
            total: null,
            used: getNumber(detail.usage) ?? 0,
            remaining: null,
            resetAtEpochMillis: resetAt,
            startsAt: resetAt == null ? null : monitorWindowStart(resetAt, raw),
            endsAt: resetAt,
            unit: "Request",
          },
        ],
      };
    });
}

function captured(
  snapshot: QuotaSnapshot,
  fetchedAt: number,
  payloadFormat: string,
  normalizerVersion: number,
  rawPayload: unknown,
): CapturedQuotaSnapshot {
  return {
    snapshot,
    replayPayload: {
      fetchedAt,
      payloadFormat,
      rawPayloadJson: JSON.stringify(rawPayload),
      normalizerVersion,
    },
  };
}

function requiredCredential(credentials: SecretBundle, key: string) {
  const value = credentials.values[key]?.trim();
  if (!value) throw new ProviderSyncError("validation", `Missing required credential: ${key}`);
  return value;
}

function optionalHeader(key: string, value?: string) {
  return value?.trim() ? { [key]: value.trim() } : {};
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ProviderSyncError("schema_changed", "Provider returned invalid JSON.");
  }
}

function providerErrorMessage(body: unknown) {
  const record = getOptionalRecord(body);
  if (!record) return null;
  return (
    getOptionalString(record.message) ??
    getOptionalString(record.msg) ??
    getOptionalString(record.error_description) ??
    getOptionalString(record.error)
  );
}

function httpFailureType(status: number) {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limited";
  if (status === 408 || status >= 500) return "transient";
  return "validation";
}

function miniMaxFailureType(statusCode: number | null) {
  if (statusCode === 1004) return "auth";
  if (statusCode === 1002 || statusCode === 1041) return "rate_limited";
  if ([1000, 1001, 1024, 1033].includes(statusCode ?? -1)) return "transient";
  if ([1008, 1026, 1027, 1039, 1042, 1043].includes(statusCode ?? -1)) {
    return "validation";
  }
  return "unknown";
}

function durationSecondsToScope(seconds: number | null): QuotaWindow["scope"] {
  if (seconds == null) return "Rolling";
  const days = seconds / 86400;
  if (Math.abs(days - 1) <= 0.25) return "Daily";
  if (Math.abs(days - 7) <= 1.5) return "Weekly";
  if (Math.abs(days - 30) <= 5) return "Monthly";
  return "Rolling";
}

function primaryCodexTitle(planType: string | null) {
  const normalized = planType?.trim();
  return normalized ? `OpenAI Codex ${toDisplayTitle(normalized)}` : "OpenAI Codex";
}

function kimiWindowScope(window: Record<string, unknown>): QuotaWindow["scope"] {
  switch (getOptionalString(window.timeUnit)) {
    case "TIME_UNIT_DAY":
      return "Daily";
    case "TIME_UNIT_MONTH":
      return "Monthly";
    default:
      return "Rolling";
  }
}

function kimiWindowLabel(window: Record<string, unknown>) {
  const duration = Math.trunc(getNumber(window.duration) ?? 1);
  const timeUnit = getOptionalString(window.timeUnit);
  if (timeUnit === "TIME_UNIT_MINUTE" && duration >= 60 && duration % 60 === 0) {
    return pluralizedDuration(duration / 60, "hour");
  }
  const unit =
    timeUnit === "TIME_UNIT_HOUR"
      ? "hour"
      : timeUnit === "TIME_UNIT_DAY"
        ? "day"
        : timeUnit === "TIME_UNIT_MONTH"
          ? "month"
          : "window";
  return pluralizedDuration(duration, unit);
}

function kimiWindowStart(resetAt: number, window: Record<string, unknown>) {
  const duration = Math.trunc(getNumber(window.duration) ?? 0);
  const date = new Date(resetAt);
  switch (getOptionalString(window.timeUnit)) {
    case "TIME_UNIT_MINUTE":
      date.setMinutes(date.getMinutes() - duration);
      return date.getTime();
    case "TIME_UNIT_HOUR":
      date.setHours(date.getHours() - duration);
      return date.getTime();
    case "TIME_UNIT_DAY":
      date.setDate(date.getDate() - duration);
      return date.getTime();
    case "TIME_UNIT_MONTH":
      date.setMonth(date.getMonth() - duration);
      return date.getTime();
    default:
      return null;
  }
}

function monitorHeaders(authorization: string) {
  return {
    Authorization: authorization,
    "Accept-Language": "en-US,en",
    "Content-Type": "application/json",
  };
}

function monitorBaseUrl(rawBaseUrl: string | undefined, defaultBaseUrl: string) {
  const parsed = new URL(rawBaseUrl?.trim() || defaultBaseUrl);
  return `${parsed.protocol}//${parsed.host}/`;
}

function monitorUrl(
  baseUrl: string,
  path: string,
  query?: { startTime: string; endTime: string },
) {
  const url = new URL(path, baseUrl);
  if (query) {
    url.searchParams.set("startTime", query.startTime);
    url.searchParams.set("endTime", query.endTime);
  }
  return url.toString();
}

function monitorUsageWindow() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  const end = new Date(now);
  end.setHours(end.getHours() + 1, 0, -1, 0);
  return {
    startTime: formatDateTime(start),
    endTime: formatDateTime(end),
  };
}

function monitorData(envelope: Record<string, unknown>, endpointName: string) {
  const success = envelope.success;
  const code = getNumber(envelope.code);
  if (success === false) {
    throw new ProviderSyncError(
      monitorFailureType(code, getOptionalString(envelope.msg)),
      getOptionalString(envelope.msg) ?? `Request to ${endpointName} failed`,
      code ?? undefined,
    );
  }
  if (code != null && code !== 200) {
    throw new ProviderSyncError(
      monitorFailureType(code, getOptionalString(envelope.msg)),
      getOptionalString(envelope.msg) ?? `Unexpected response code ${code} from ${endpointName}`,
      code,
    );
  }
  const data = getOptionalRecord(envelope.data);
  if (!data) {
    throw new ProviderSyncError(
      "schema_changed",
      `Missing data in ${endpointName} response`,
    );
  }
  return data;
}

function monitorFailureType(code: number | null, message: string | null) {
  const lowerMessage = message?.toLowerCase() ?? "";
  const looksAuth = [
    "auth",
    "token",
    "unauthorized",
    "forbidden",
    "credential",
    "api key",
    "apikey",
    "permission",
    "login",
  ].some((value) => lowerMessage.includes(value));
  if (code === 401 || code === 403 || looksAuth) return "auth";
  if (code === 429) return "rate_limited";
  if (code != null && code >= 500) return "transient";
  return "validation";
}

function sampleWindowFromTimes(values: unknown[]) {
  const first = values.at(0);
  const last = values.at(-1);
  if (typeof first !== "string" || typeof last !== "string") return null;
  const startsAt = parseLocalHour(first);
  const lastHour = parseLocalHour(last);
  if (startsAt == null || lastHour == null) return null;
  return { startsAt, endsAt: lastHour + 3600000 - 1 };
}

type SampleWindow = NonNullable<ReturnType<typeof sampleWindowFromTimes>>;

function summarizedToolUsage(toolUsage: Record<string, unknown>, keys: string[]) {
  const totalUsage = getOptionalRecord(toolUsage.totalUsage) ?? {};
  const summaries = [
    ...getArray(toolUsage.toolSummaryList),
    ...getArray(totalUsage.toolDetails),
    ...getArray(totalUsage.toolSummaryList),
  ].map(getRecord);

  return summaries
    .filter((summary) => {
      const candidates = [summary.toolName, summary.modelCode]
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.toLowerCase());
      return candidates.some((candidate) =>
        keys.some((key) => candidate.includes(key.toLowerCase())),
      );
    })
    .reduce((sum, summary) => sum + (getNumber(summary.usage) ?? 0), 0);
}

function monitorWindowScope(raw: Record<string, unknown>): QuotaWindow["scope"] {
  switch (getNumber(raw.unit)) {
    case 5:
      return "Monthly";
    case 3:
      return "Rolling";
    default:
      return "Rolling";
  }
}

function monitorBucket(raw: Record<string, unknown>) {
  switch (getString(raw.type).trim().toUpperCase()) {
    case "TOKENS_LIMIT":
      return quotaBuckets.tokens;
    case "TIME_LIMIT":
      return quotaBuckets.mcp;
    default:
      return getString(raw.type).trim().toLowerCase();
  }
}

function monitorWindowLabel(raw: Record<string, unknown>) {
  const duration = Math.trunc(getNumber(raw.number) ?? 1);
  switch (getNumber(raw.unit)) {
    case 5:
      return pluralizedDuration(duration, "month");
    case 3:
      return pluralizedDuration(duration, "hour");
    default:
      return "current window";
  }
}

function monitorWindowStart(resetAt: number, raw: Record<string, unknown>) {
  const duration = Math.trunc(getNumber(raw.number) ?? 0);
  if (duration <= 0) return null;
  const date = new Date(resetAt);
  switch (getNumber(raw.unit)) {
    case 5:
      date.setMonth(date.getMonth() - duration);
      return date.getTime();
    case 3:
      date.setHours(date.getHours() - duration);
      return date.getTime();
    default:
      return null;
  }
}

function limitDisplayTitle(value: string) {
  switch (value) {
    case "TOKENS_LIMIT":
      return "Token usage";
    case "TIME_LIMIT":
      return "MCP usage";
    default:
      return toDisplayTitle(value);
  }
}

function firstNonZero(...values: number[]) {
  return values.find((value) => value > 0) ?? 0;
}

function sortOrder(value: Record<string, unknown>) {
  return getNumber(value.sortOrder) ?? Number.MAX_SAFE_INTEGER;
}

function nonNegativeLong(value: string, fieldName: string) {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed)) {
    throw new ProviderSyncError("validation", `Invalid quota ${fieldName} value: ${value}`);
  }
  return Math.max(parsed, 0);
}

function positiveNumber(value: unknown) {
  const number = getNumber(value);
  return number == null || number <= 0 ? null : number;
}

function getRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new ProviderSyncError("schema_changed", "Provider response shape changed.");
}

function getOptionalRecord(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function getArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function getString(value: unknown) {
  if (typeof value !== "string") {
    throw new ProviderSyncError("schema_changed", "Provider response shape changed.");
  }
  return value;
}

function getOptionalString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pluralizedDuration(value: number, unit: string) {
  return value === 1 ? `${value} ${unit}` : `${value} ${unit}s`;
}

function parseIsoMillis(value: string) {
  const millis = Date.parse(value);
  return Number.isNaN(millis) ? null : millis;
}

function parseLocalHour(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  ).getTime();
}

function formatDateTime(value: Date) {
  const parts = [
    value.getFullYear(),
    value.getMonth() + 1,
    value.getDate(),
    value.getHours(),
    value.getMinutes(),
    value.getSeconds(),
  ].map((part) => String(part).padStart(2, "0"));
  return `${parts[0]}-${parts[1]}-${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`;
}

function toDisplayTitle(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.toLowerCase().replace(/^\w/, (char) => char.toUpperCase()))
    .join(" ");
}

const miniMaxAnchorKeys = new Set(["MiniMax-M*", "coding-plan-vlm", "coding-plan-search"]);

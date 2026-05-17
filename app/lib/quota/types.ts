export type CredentialFieldSpec = {
  key: string;
  label: string;
  isSecret: boolean;
  isRequired: boolean;
};

export type ProviderDescriptor = {
  id: string;
  displayName: string;
  credentialFields: CredentialFieldSpec[];
};

export type SecretBundle = {
  values: Record<string, string>;
};

export type QuotaSnapshot = {
  fetchedAt: number;
  resources: QuotaResource[];
};

export type QuotaResource = {
  key: string;
  title: string;
  type: ResourceType;
  role?: ResourceRole;
  bucket?: string;
  windows: QuotaWindow[];
};

export type ResourceType = "Model" | "Plan" | "Feature";
export type ResourceRole = "Limit" | "Contributor" | "Sampled" | "Anchor";
export type WindowScope = "Interval" | "Daily" | "Weekly" | "Monthly" | "Rolling";
export type QuotaUnit = "Request" | "Token" | "Credit" | "Minute" | "Percent";

export type QuotaWindow = {
  windowKey: string;
  scope: WindowScope;
  label?: string;
  total: number | null;
  used: number | null;
  remaining: number | null;
  resetAtEpochMillis: number | null;
  startsAt?: number | null;
  endsAt?: number | null;
  unit: QuotaUnit;
};

export type ProviderReplayPayload = {
  fetchedAt: number;
  payloadFormat: string;
  rawPayloadJson: string;
  normalizerVersion: number;
};

export type CapturedQuotaSnapshot = {
  snapshot: QuotaSnapshot;
  replayPayload: ProviderReplayPayload;
};

export type ProviderFailureType =
  | "auth"
  | "rate_limited"
  | "transient"
  | "schema_changed"
  | "validation"
  | "unknown";

export class ProviderSyncError extends Error {
  constructor(
    readonly type: ProviderFailureType,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderSyncError";
  }
}

export type QuotaSubscription = {
  id: string;
  userId: string;
  providerId: string;
  providerDisplayName: string;
  customTitle: string | null;
  displayTitle: string;
  syncState: "active" | "auth_failed" | "sync_error" | "pending";
  lastSyncedAt: number | null;
  createdAt: number;
  updatedAt: number;
  snapshot: QuotaSnapshot | null;
};

export type DeletedQuotaSubscription = {
  id: string;
  deletedAt: number;
};

export type RelayClientToken = {
  id: string;
  name: string;
  tokenPrefix: string;
  createdAt: number;
  lastUsedAt: number | null;
};

export type RelaySettings = {
  remoteClientAccessEnabled: boolean;
  refreshMode: RelayRefreshMode;
};

export const relayRefreshModes = ["realtime", "balanced", "manual"] as const;
export type RelayRefreshMode = (typeof relayRefreshModes)[number];

export const relayRefreshModeLabels = {
  realtime: "Realtime",
  balanced: "Balanced",
  manual: "Manual",
} satisfies Record<RelayRefreshMode, string>;

export const relayRefreshModeIntervals = {
  realtime: 60_000,
  balanced: 3_600_000,
  manual: null,
} satisfies Record<RelayRefreshMode, number | null>;

export const defaultRelayRefreshMode: RelayRefreshMode = "manual";

export function isRelayRefreshMode(value: unknown): value is RelayRefreshMode {
  return (
    typeof value === "string" &&
    (relayRefreshModes as readonly string[]).includes(value)
  );
}

export const quotaBuckets = {
  budget: "budget",
  tokens: "tokens",
  mcp: "mcp",
  modelCalls: "model-calls",
} as const;

export const quotaWindowLabels = {
  primary: "primary",
  secondary: "secondary",
  sampled: "sampled",
  current: "current",
  interval: "interval",
  weekly: "weekly",
} as const;

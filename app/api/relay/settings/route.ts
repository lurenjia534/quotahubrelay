import { jsonError, requireSessionUser } from "@/app/lib/quota/api";
import {
  getRelaySettings,
  updateRelaySettings,
} from "@/app/lib/quota/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireSessionUser(request);
  if (user instanceof Response) return user;

  const settings = await getRelaySettings(user.id);
  return Response.json({ settings });
}

export async function PATCH(request: Request) {
  const user = await requireSessionUser(request);
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", "Request body must be valid JSON.", 400);
  }

  const input = parseSettingsBody(body);
  if (input instanceof Response) return input;

  const settings = await updateRelaySettings(user.id, input);
  return Response.json({ settings });
}

function parseSettingsBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return jsonError("invalid_body", "Request body must be an object.", 400);
  }

  const remoteClientAccessEnabled = (
    value as Record<string, unknown>
  ).remoteClientAccessEnabled;

  if (typeof remoteClientAccessEnabled !== "boolean") {
    return jsonError(
      "invalid_remote_client_access",
      "`remoteClientAccessEnabled` must be a boolean.",
      400,
    );
  }

  return { remoteClientAccessEnabled };
}

import {
  jsonError,
  providerErrorResponse,
  requireApiUser,
} from "@/app/lib/quota/api";
import {
  normalizeSecretBundle,
  providerById,
  requireCredentials,
} from "@/app/lib/quota/providers";
import {
  createSubscription,
  listSubscriptions,
} from "@/app/lib/quota/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof Response) return user;

  const subscriptions = await listSubscriptions(user.id);
  return Response.json({ subscriptions });
}

export async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", "Request body must be valid JSON.", 400);
  }

  const input = parseCreateSubscriptionBody(body);
  if (input instanceof Response) return input;

  const provider = providerById(input.providerId);
  if (!provider) {
    return jsonError("unsupported_provider", "Unsupported provider.", 400);
  }

  try {
    const credentials = normalizeSecretBundle(input.credentials);
    requireCredentials(provider.descriptor, credentials);
    const capturedSnapshot = await provider.validate(credentials);
    const subscription = await createSubscription({
      userId: user.id,
      providerId: provider.descriptor.id,
      customTitle: input.customTitle,
      credentials,
      capturedSnapshot,
    });

    return Response.json({ subscription }, { status: 201 });
  } catch (error) {
    return providerErrorResponse(error);
  }
}

function parseCreateSubscriptionBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return jsonError("invalid_body", "Request body must be an object.", 400);
  }
  const body = value as Record<string, unknown>;
  if (typeof body.providerId !== "string" || !body.providerId.trim()) {
    return jsonError("invalid_provider", "`providerId` is required.", 400);
  }

  return {
    providerId: body.providerId.trim(),
    customTitle:
      typeof body.customTitle === "string" && body.customTitle.trim()
        ? body.customTitle.trim()
        : null,
    credentials: body.credentials,
  };
}

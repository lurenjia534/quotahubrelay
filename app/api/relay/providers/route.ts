import { providerDescriptors } from "@/app/lib/quota/providers";
import { requireApiUser } from "@/app/lib/quota/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof Response) return user;

  return Response.json({ providers: providerDescriptors });
}

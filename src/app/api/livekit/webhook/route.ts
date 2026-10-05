import { WebhookReceiver } from "livekit-server-sdk";
import { handleRoute, json, AppError } from "@/lib/api/http";
import { env } from "@/lib/env";
import { applyLivekitEvent } from "@/server/services/livekit-webhook-service";

let receiver: WebhookReceiver | null = null;

/**
 * LiveKit server → app webhook. The body is signed with our API secret (JWT in
 * the Authorization header carrying a SHA-256 of the body), so nothing here is
 * trusted until `receive` verifies it.
 */
export const POST = handleRoute(async (req) => {
  receiver ??= new WebhookReceiver(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);

  const body = await req.text();
  const auth = req.headers.get("authorization") ?? undefined;

  let event;
  try {
    event = await receiver.receive(body, auth);
  } catch {
    throw new AppError(401, "BAD_SIGNATURE", "Assinatura inválida");
  }

  await applyLivekitEvent(event);
  return json({ ok: true });
});

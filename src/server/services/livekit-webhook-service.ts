import { TrackSource, type WebhookEvent } from "livekit-server-sdk";
import { logger } from "@/lib/logger";
import {
  roomHasScreenShare,
  roomIdFromLivekitName,
} from "@/lib/livekit/token";
import { setRoomStatus } from "./room-service";
import { recordAudit } from "./audit-service";

/**
 * Reconcile a room's LIVE/WAITING status from what the media server reports.
 *
 * The host's browser also reports status (`/api/rooms/[slug]/status`), but a
 * closed tab or a phone losing signal never sends "stopped" — the room would
 * stay LIVE forever. LiveKit webhooks close that gap server-side.
 */
export async function applyLivekitEvent(event: WebhookEvent): Promise<void> {
  const roomId = event.room?.name ? roomIdFromLivekitName(event.room.name) : null;
  if (!roomId) return;

  const isScreenShare = event.track?.source === TrackSource.SCREEN_SHARE;
  let next: "LIVE" | "WAITING" | null = null;

  switch (event.event) {
    case "track_published":
      if (isScreenShare) next = "LIVE";
      break;
    case "track_unpublished":
    case "participant_left":
    case "participant_connection_aborted":
      if (event.event === "track_unpublished" && !isScreenShare) break;
      // Another publisher (owner + moderator) may still be sharing.
      if (!(await roomHasScreenShare(roomId))) next = "WAITING";
      break;
    case "room_finished":
      next = "WAITING";
      break;
  }

  if (!next) return;

  const changed = await setRoomStatus(roomId, next);
  if (!changed) return;

  logger.info({ roomId, status: next, event: event.event }, "Room status reconciled");
  await recordAudit({
    roomId,
    event: next === "LIVE" ? "stream.started" : "stream.stopped",
    metadata: { source: "livekit-webhook", trigger: event.event },
  });
}

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TrackSource, type WebhookEvent } from "livekit-server-sdk";

const setRoomStatus = vi.fn();
const roomHasScreenShare = vi.fn();
const recordAudit = vi.fn();

vi.mock("@/server/services/room-service", () => ({
  setRoomStatus: (...a: unknown[]) => setRoomStatus(...a),
}));
vi.mock("@/server/services/audit-service", () => ({
  recordAudit: (...a: unknown[]) => recordAudit(...a),
}));
vi.mock("@/lib/livekit/token", () => ({
  roomIdFromLivekitName: (n: string) => (n.startsWith("sr_") ? n.slice(3) : null),
  roomHasScreenShare: (...a: unknown[]) => roomHasScreenShare(...a),
}));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn() } }));

const { applyLivekitEvent } = await import(
  "@/server/services/livekit-webhook-service"
);

function ev(
  event: string,
  opts: { room?: string; source?: TrackSource } = {},
): WebhookEvent {
  return {
    event,
    room: { name: opts.room ?? "sr_room1" },
    track: opts.source === undefined ? undefined : { source: opts.source },
  } as unknown as WebhookEvent;
}

beforeEach(() => {
  setRoomStatus.mockReset().mockResolvedValue(true);
  roomHasScreenShare.mockReset().mockResolvedValue(false);
  recordAudit.mockReset();
});

describe("applyLivekitEvent", () => {
  it("marks the room LIVE when a screen share is published", async () => {
    await applyLivekitEvent(ev("track_published", { source: TrackSource.SCREEN_SHARE }));
    expect(setRoomStatus).toHaveBeenCalledWith("room1", "LIVE");
    expect(recordAudit).toHaveBeenCalledOnce();
  });

  it("ignores non-screen-share tracks", async () => {
    await applyLivekitEvent(ev("track_published", { source: TrackSource.MICROPHONE }));
    await applyLivekitEvent(ev("track_unpublished", { source: TrackSource.MICROPHONE }));
    expect(setRoomStatus).not.toHaveBeenCalled();
  });

  it("marks WAITING when the host drops and nobody else is sharing", async () => {
    await applyLivekitEvent(ev("participant_left"));
    expect(setRoomStatus).toHaveBeenCalledWith("room1", "WAITING");
  });

  it("stays LIVE while another participant is still sharing", async () => {
    roomHasScreenShare.mockResolvedValue(true);
    await applyLivekitEvent(ev("track_unpublished", { source: TrackSource.SCREEN_SHARE }));
    expect(setRoomStatus).not.toHaveBeenCalled();
  });

  it("marks WAITING when the LiveKit room finishes", async () => {
    await applyLivekitEvent(ev("room_finished"));
    expect(setRoomStatus).toHaveBeenCalledWith("room1", "WAITING");
  });

  it("ignores rooms this app did not create", async () => {
    await applyLivekitEvent(ev("room_finished", { room: "other" }));
    expect(setRoomStatus).not.toHaveBeenCalled();
  });

  it("does not audit when the status was already correct", async () => {
    setRoomStatus.mockResolvedValue(false);
    await applyLivekitEvent(ev("room_finished"));
    expect(recordAudit).not.toHaveBeenCalled();
  });
});

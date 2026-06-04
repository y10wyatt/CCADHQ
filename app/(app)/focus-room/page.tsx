import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getFocusRoom } from "@/features/focus/application/get-focus-room";
import { FocusRoomClient } from "@/features/focus/ui/focus-room-client";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function FocusRoomPage() {
  const member = await requireCurrentMember();
  const room = await getFocusRoom(member);

  return (
    <>
      <PageHeader
        eyebrow="Focus Room"
        title="Settle into the work"
        description="Run a fixed Pomodoro or record however long you spend on a task."
        action={
          <StatusPill tone={room.activeSession ? "info" : "neutral"}>
            {room.activeSession ? "Active session restored" : "Ready to focus"}
          </StatusPill>
        }
      />
      <FocusRoomClient room={room} />
    </>
  );
}

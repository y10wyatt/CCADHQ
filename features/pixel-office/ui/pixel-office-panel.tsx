"use client";

import { PixelOffice } from "@/features/pixel-office/ui/pixel-office";
import { usePresence } from "@/features/presence/ui/presence-provider";

export function PixelOfficePanel() {
  const {
    currentMemberId,
    members,
    connectionState,
    setPixelOfficePosition,
  } = usePresence();

  return (
    <PixelOffice
      currentMemberId={currentMemberId}
      members={members}
      connectionState={connectionState}
      onMoveCurrentMember={setPixelOfficePosition}
    />
  );
}

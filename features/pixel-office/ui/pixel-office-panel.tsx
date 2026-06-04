"use client";

import { PixelOffice } from "@/features/pixel-office/ui/pixel-office";
import { usePresence } from "@/features/presence/ui/presence-provider";

export function PixelOfficePanel() {
  const { members, connectionState } = usePresence();

  return (
    <PixelOffice members={members} connectionState={connectionState} />
  );
}

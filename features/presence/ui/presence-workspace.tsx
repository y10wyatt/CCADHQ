"use client";

import { useState } from "react";

import { PixelOfficePanel } from "@/features/pixel-office/ui/pixel-office-panel";
import { PresencePanel } from "@/features/presence/ui/presence-panel";
import { cn } from "@/shared/lib/cn";

type PresenceView = "list" | "pixel_office";

export function PresenceWorkspace() {
  const [view, setView] = useState<PresenceView>("list");

  return (
    <div className="grid gap-4">
      <div
        className="grid grid-cols-2 rounded-lg border border-border bg-muted/30 p-1"
        role="group"
        aria-label="Choose coworking presence view"
      >
        <ViewButton
          active={view === "list"}
          onClick={() => setView("list")}
        >
          Status list
        </ViewButton>
        <ViewButton
          active={view === "pixel_office"}
          onClick={() => setView("pixel_office")}
        >
          Pixel Office
        </ViewButton>
      </div>

      <div aria-live="polite">
        {view === "list" ? <PresencePanel compact /> : <PixelOfficePanel />}
      </div>
    </div>
  );
}

function ViewButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-2 text-xs font-semibold transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

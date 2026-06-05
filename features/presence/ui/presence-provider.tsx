"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { CurrentMember } from "@/features/auth/domain/current-member";
import {
  derivePresenceStatus,
  getPresenceLocation,
  normalizePresenceState,
  type PresenceConnectionState,
  type PresenceFocusState,
  type PresenceMember,
  type PresencePayload,
} from "@/features/presence/domain/presence";
import { createBrowserSupabaseClient } from "@/shared/database/supabase/browser";

const AWAY_AFTER_MS = 10 * 60 * 1000;
const STALE_GRACE_MS = 2 * 60 * 1000;

interface PresenceContextValue {
  members: PresenceMember[];
  connectionState: PresenceConnectionState;
  lastSyncedAt: string | null;
}

type PresencePayloadData = Omit<PresencePayload, "clientId" | "updatedAt">;

const PresenceContext = createContext<PresenceContextValue>({
  members: [],
  connectionState: "unavailable",
  lastSyncedAt: null,
});

export function PresenceProvider({
  children,
  member,
  focusState,
}: {
  children: React.ReactNode;
  member: CurrentMember;
  focusState: PresenceFocusState | null;
}) {
  const pathname = usePathname();
  const [isAway, setIsAway] = useState(false);
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [connectionState, setConnectionState] =
    useState<PresenceConnectionState>("connecting");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);
  const clientIdRef = useRef<string | null>(null);
  const lastActivityRef = useRef(0);
  const status = derivePresenceStatus(focusState, isAway);
  const location = getPresenceLocation(pathname);
  const payloadDataRef = useRef<PresencePayloadData>({
    memberId: member.id,
    displayName: member.displayName,
    avatarUrl: member.avatarUrl,
    status,
    location,
    focusSessionId: focusState?.id ?? null,
    version: 1,
  });

  useEffect(() => {
    lastActivityRef.current = Date.now();

    function recordActivity() {
      lastActivityRef.current = Date.now();
      setIsAway(false);
    }

    function recordVisibility() {
      if (document.visibilityState === "visible") recordActivity();
    }

    const activityEvents = ["keydown", "pointerdown", "focus"] as const;
    activityEvents.forEach((event) =>
      window.addEventListener(event, recordActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", recordVisibility);
    const awayTimer = window.setInterval(() => {
      setIsAway(Date.now() - lastActivityRef.current >= AWAY_AFTER_MS);
    }, 30_000);

    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, recordActivity),
      );
      document.removeEventListener("visibilitychange", recordVisibility);
      window.clearInterval(awayTimer);
    };
  }, []);

  useEffect(() => {
    let staleTimer: number | undefined;
    let isCancelled = false;
    const clientId = globalThis.crypto.randomUUID();
    clientIdRef.current = clientId;

    function markStale() {
      subscribedRef.current = false;
      setConnectionState((current) =>
        current === "live" || current === "stale" ? "stale" : "unavailable",
      );
      window.clearTimeout(staleTimer);
      staleTimer = window.setTimeout(() => {
        setMembers([]);
        setConnectionState("unavailable");
      }, STALE_GRACE_MS);
    }

    async function subscribeToPresence() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (isCancelled) return;
      if (error || !session) {
        markStale();
        return;
      }

      await supabase.realtime.setAuth(session.access_token);
      if (isCancelled) return;

      const channel = supabase.channel(
        `org:${member.organization.id}:presence`,
        {
          config: {
            presence: { key: clientId },
            private: true,
          },
        },
      );
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          window.clearTimeout(staleTimer);
          setMembers(
            normalizePresenceState(
              channel.presenceState<PresencePayload>() as Record<
                string,
                unknown[]
              >,
            ),
          );
          setLastSyncedAt(new Date().toISOString());
          setConnectionState("live");
        })
        .subscribe(async (nextState) => {
          if (nextState === "SUBSCRIBED") {
            subscribedRef.current = true;
            setConnectionState("live");
            await channel.track(buildPayload(payloadDataRef.current, clientId));
            return;
          }

          if (
            nextState === "CHANNEL_ERROR" ||
            nextState === "TIMED_OUT" ||
            nextState === "CLOSED"
          ) {
            markStale();
          }
        });
    }

    void subscribeToPresence();

    return () => {
      isCancelled = true;
      window.clearTimeout(staleTimer);
      subscribedRef.current = false;
      clientIdRef.current = null;
      const channel = channelRef.current;
      channelRef.current = null;
      if (channel) {
        void channel.untrack();
        void supabase.removeChannel(channel);
      }
    };
  }, [member.organization.id, supabase]);

  useEffect(() => {
    payloadDataRef.current = {
      memberId: member.id,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      status,
      location,
      focusSessionId: focusState?.id ?? null,
      version: 1,
    };

    const channel = channelRef.current;
    const clientId = clientIdRef.current;
    if (!channel || !clientId || !subscribedRef.current) return;
    void channel.track(buildPayload(payloadDataRef.current, clientId));
  }, [
    focusState?.id,
    location,
    member.avatarUrl,
    member.displayName,
    member.id,
    status,
  ]);

  return (
    <PresenceContext.Provider
      value={{ members, connectionState, lastSyncedAt }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}

function buildPayload(
  data: PresencePayloadData,
  clientId: string,
): PresencePayload {
  return {
    ...data,
    clientId,
    updatedAt: new Date().toISOString(),
  };
}

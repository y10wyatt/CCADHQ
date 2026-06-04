import type { MemberRole } from "@/shared/database/database.types";

export interface CurrentMember {
  id: string;
  userId: string;
  role: MemberRole;
  displayName: string;
  avatarUrl: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    currencyCode: string;
  };
}

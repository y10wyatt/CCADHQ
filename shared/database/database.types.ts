export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MemberRole = "staff" | "admin";
export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";
export type ChangeOperation = "insert" | "update" | "delete";
export type TaskStatus =
  | "backlog"
  | "planned"
  | "in_progress"
  | "blocked"
  | "done";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type XpEventType =
  | "focus_session_completed"
  | "task_completed"
  | "weekly_quest_completed"
  | "correction";
export type CharacterXpEventType =
  | "focus_session_completed"
  | "task_completed"
  | "weekly_quest_completed"
  | "streak_bonus"
  | "maintenance"
  | "correction";
export type WeeklyQuestStatus = "active" | "completed" | "archived";
export type StudioStatKey =
  | "stability"
  | "reputation"
  | "creativity"
  | "community";
export type FinanceEntryType = "income" | "expense";
export type FocusMode = "pomodoro" | "freeform";
export type FocusKind = "focus" | "short_break" | "long_break";
export type FocusState = "running" | "paused" | "completed" | "cancelled";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          timezone: string;
          currency_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          timezone?: string;
          currency_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: MemberRole;
          is_active: boolean;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: MemberRole;
          is_active?: boolean;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["organization_members"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: MemberRole;
          status: InvitationStatus;
          invited_by_member_id: string | null;
          expires_at: string | null;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: MemberRole;
          status?: InvitationStatus;
          invited_by_member_id?: string | null;
          expires_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["organization_invitations"]["Insert"]
        >;
        Relationships: [];
      };
      work_categories: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          created_by_member_id: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          created_by_member_id: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["work_categories"]["Insert"]
        >;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          work_category_id: string;
          work_category_name: string;
          status: TaskStatus;
          priority: TaskPriority;
          assignee_member_id: string | null;
          due_at: string | null;
          completed_at: string | null;
          first_completed_at: string | null;
          created_by_member_id: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          work_category_id: string;
          work_category_name: string;
          status?: TaskStatus;
          priority?: TaskPriority;
          assignee_member_id?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          first_completed_at?: string | null;
          created_by_member_id: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
      xp_events: {
        Row: {
          id: string;
          organization_id: string;
          event_type: XpEventType;
          points: number;
          source_type: string;
          source_id: string | null;
          idempotency_key: string;
          actor_member_id: string | null;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          event_type: XpEventType;
          points: number;
          source_type: string;
          source_id?: string | null;
          idempotency_key: string;
          actor_member_id?: string | null;
          description: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["xp_events"]["Insert"]>;
        Relationships: [];
      };
      character_xp_events: {
        Row: {
          id: string;
          organization_id: string;
          member_id: string;
          event_type: CharacterXpEventType;
          points: number;
          source_type: string;
          source_id: string | null;
          idempotency_key: string;
          actor_member_id: string | null;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          member_id: string;
          event_type: CharacterXpEventType;
          points: number;
          source_type: string;
          source_id?: string | null;
          idempotency_key: string;
          actor_member_id?: string | null;
          description: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      weekly_quests: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          status: WeeklyQuestStatus;
          studio_stat_key: StudioStatKey | null;
          xp_value: number;
          character_xp_value: number;
          progress_current: number;
          progress_target: number;
          due_at: string | null;
          completed_at: string | null;
          completed_by_member_id: string | null;
          archived_at: string | null;
          created_by_member_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          status?: WeeklyQuestStatus;
          studio_stat_key?: StudioStatKey | null;
          xp_value?: number;
          character_xp_value?: number;
          progress_current?: number;
          progress_target?: number;
          due_at?: string | null;
          completed_at?: string | null;
          completed_by_member_id?: string | null;
          archived_at?: string | null;
          created_by_member_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["weekly_quests"]["Insert"]>;
        Relationships: [];
      };
      finance_categories: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          entry_type: FinanceEntryType;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          entry_type: FinanceEntryType;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["finance_categories"]["Insert"]
        >;
        Relationships: [];
      };
      finance_entries: {
        Row: {
          id: string;
          organization_id: string;
          entry_type: FinanceEntryType;
          amount_minor: number;
          currency_code: string;
          entry_date: string;
          category_id: string;
          category_name: string;
          description: string;
          note: string | null;
          created_by_member_id: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          entry_type: FinanceEntryType;
          amount_minor: number;
          currency_code: string;
          entry_date: string;
          category_id: string;
          category_name: string;
          description: string;
          note?: string | null;
          created_by_member_id: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["finance_entries"]["Insert"]
        >;
        Relationships: [];
      };
      focus_sessions: {
        Row: {
          id: string;
          organization_id: string;
          member_id: string;
          work_name: string | null;
          work_description: string | null;
          work_category_id: string | null;
          work_category_name: string | null;
          linked_task_id: string | null;
          continued_from_session_id: string | null;
          mode: FocusMode;
          kind: FocusKind;
          state: FocusState;
          planned_duration_seconds: number | null;
          started_at: string;
          resumed_at: string | null;
          ends_at: string | null;
          paused_at: string | null;
          remaining_seconds_at_pause: number | null;
          elapsed_seconds_at_pause: number;
          recorded_duration_seconds: number | null;
          completed_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          member_id: string;
          work_name?: string | null;
          work_description?: string | null;
          work_category_id?: string | null;
          work_category_name?: string | null;
          linked_task_id?: string | null;
          continued_from_session_id?: string | null;
          mode: FocusMode;
          kind: FocusKind;
          state?: FocusState;
          planned_duration_seconds?: number | null;
          started_at?: string;
          resumed_at?: string | null;
          ends_at?: string | null;
          paused_at?: string | null;
          remaining_seconds_at_pause?: number | null;
          elapsed_seconds_at_pause?: number;
          recorded_duration_seconds?: number | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["focus_sessions"]["Insert"]
        >;
        Relationships: [];
      };
      application_incidents: {
        Row: {
          id: string;
          organization_id: string;
          member_id: string;
          incident_key: string;
          source: string;
          route: string;
          digest: string | null;
          deployment_id: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      change_history: {
        Row: {
          id: string;
          organization_id: string | null;
          table_name: string;
          record_id: string | null;
          operation: ChangeOperation;
          actor_user_id: string | null;
          actor_member_id: string | null;
          source: string;
          changed_fields: string[];
          old_data: Json | null;
          new_data: Json | null;
          occurred_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          organization_id: string;
          actor_member_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      start_focus_session: {
        Args: {
          target_organization_id: string;
          session_mode: FocusMode;
          session_kind: FocusKind;
          session_work_name?: string | null;
          session_work_description?: string | null;
          session_work_category_id?: string | null;
          session_linked_task_id?: string | null;
          session_continued_from_id?: string | null;
        };
        Returns: string;
      };
      pause_focus_session: {
        Args: { target_session_id: string };
        Returns: undefined;
      };
      resume_focus_session: {
        Args: { target_session_id: string };
        Returns: undefined;
      };
      update_focus_session_details: {
        Args: {
          target_session_id: string;
          session_work_name: string;
          session_work_description: string;
          session_work_category_id: string;
          session_linked_task_id?: string | null;
        };
        Returns: undefined;
      };
      complete_focus_session: {
        Args: { target_session_id: string };
        Returns: Json;
      };
      cancel_focus_session: {
        Args: { target_session_id: string };
        Returns: undefined;
      };
      record_application_incident: {
        Args: {
          target_incident_key: string;
          incident_source: string;
          incident_route: string;
          incident_digest?: string | null;
          incident_deployment_id?: string | null;
        };
        Returns: string;
      };
      create_studio_xp_correction: {
        Args: {
          target_organization_id: string;
          correction_id: string;
          correction_points: number;
          correction_reason: string;
        };
        Returns: Json;
      };
      create_task: {
        Args: {
          target_organization_id: string;
          task_title: string;
          task_description?: string | null;
          task_work_category_id: string;
          task_priority: TaskPriority;
          task_assignee_member_id?: string | null;
          task_due_at?: string | null;
        };
        Returns: string;
      };
      update_task_details: {
        Args: {
          target_task_id: string;
          task_title: string;
          task_description?: string | null;
          task_work_category_id: string;
          task_priority: TaskPriority;
          task_assignee_member_id?: string | null;
          task_due_at?: string | null;
        };
        Returns: undefined;
      };
      transition_task: {
        Args: {
          target_task_id: string;
          target_status: TaskStatus;
        };
        Returns: Json;
      };
      archive_task: {
        Args: { target_task_id: string };
        Returns: undefined;
      };
      create_weekly_quest: {
        Args: {
          target_organization_id: string;
          quest_title: string;
          quest_description?: string | null;
          quest_studio_stat_key?: StudioStatKey | null;
          quest_xp_value?: number;
          quest_character_xp_value?: number;
          quest_progress_target?: number;
          quest_due_at?: string | null;
        };
        Returns: string;
      };
      update_weekly_quest: {
        Args: {
          target_quest_id: string;
          quest_title: string;
          quest_description?: string | null;
          quest_studio_stat_key?: StudioStatKey | null;
          quest_xp_value?: number;
          quest_character_xp_value?: number;
          quest_progress_current?: number;
          quest_progress_target?: number;
          quest_due_at?: string | null;
        };
        Returns: undefined;
      };
      complete_weekly_quest: {
        Args: { target_quest_id: string };
        Returns: Json;
      };
      archive_weekly_quest: {
        Args: { target_quest_id: string };
        Returns: undefined;
      };
      create_finance_entry: {
        Args: {
          target_organization_id: string;
          finance_entry_type: FinanceEntryType;
          finance_amount_minor: number;
          finance_entry_date: string;
          finance_category_id: string;
          finance_description: string;
          finance_note?: string | null;
        };
        Returns: string;
      };
      update_finance_entry: {
        Args: {
          target_entry_id: string;
          finance_entry_type: FinanceEntryType;
          finance_amount_minor: number;
          finance_entry_date: string;
          finance_category_id: string;
          finance_description: string;
          finance_note?: string | null;
        };
        Returns: undefined;
      };
      archive_finance_entry: {
        Args: { target_entry_id: string };
        Returns: undefined;
      };
      create_organization_invitation: {
        Args: {
          target_organization_id: string;
          invitation_email: string;
          invitation_role: MemberRole;
        };
        Returns: string;
      };
      revoke_organization_invitation: {
        Args: { target_invitation_id: string };
        Returns: undefined;
      };
      update_organization_member_access: {
        Args: {
          target_member_id: string;
          target_role: MemberRole;
          target_is_active: boolean;
        };
        Returns: undefined;
      };
    };
    Enums: {
      member_role: MemberRole;
      invitation_status: InvitationStatus;
      change_operation: ChangeOperation;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      xp_event_type: XpEventType;
      character_xp_event_type: CharacterXpEventType;
      weekly_quest_status: WeeklyQuestStatus;
      studio_stat_key: StudioStatKey;
      finance_entry_type: FinanceEntryType;
      focus_mode: FocusMode;
      focus_kind: FocusKind;
      focus_state: FocusState;
    };
    CompositeTypes: Record<string, never>;
  };
}

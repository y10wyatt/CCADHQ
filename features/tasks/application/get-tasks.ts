import type { CurrentMember } from "@/features/auth/domain/current-member";
import type {
  TasksViewModel,
  TaskView,
} from "@/features/tasks/domain/tasks";
import type { Database } from "@/shared/database/database.types";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

export async function getTasks(member: CurrentMember): Promise<TasksViewModel> {
  const supabase = await createServerSupabaseClient();
  const organizationId = member.organization.id;
  const [tasks, categories, members] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("work_categories")
      .select("id, name")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("organization_members")
      .select(
        "id, profile:profiles!organization_members_user_id_fkey(display_name)",
      )
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("joined_at"),
  ]);

  const firstError = [tasks.error, categories.error, members.error].find(Boolean);
  if (firstError) {
    throw new Error(`Unable to load Tasks: ${firstError.message}`);
  }

  const categoryNames = new Map(
    (categories.data ?? []).map((category) => [category.id, category.name]),
  );
  const memberNames = new Map(
    (members.data ?? []).map((candidate) => [
      candidate.id,
      candidate.profile?.display_name ?? "Unnamed member",
    ]),
  );

  return {
    tasks: (tasks.data ?? []).map((task) =>
      mapTask(task, categoryNames, memberNames),
    ),
    categories: (categories.data ?? []).map((category) => ({
      id: category.id,
      name: category.name,
    })),
    members: (members.data ?? []).map((candidate) => ({
      id: candidate.id,
      name: candidate.profile?.display_name ?? "Unnamed member",
    })),
    loadedAtMs: Date.now(),
  };
}

function mapTask(
  task: Database["public"]["Tables"]["tasks"]["Row"],
  categoryNames: Map<string, string>,
  memberNames: Map<string, string>,
): TaskView {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    workCategoryId: task.work_category_id,
    workCategoryName:
      task.work_category_name ??
      categoryNames.get(task.work_category_id) ??
      "Archived category",
    status: task.status,
    priority: task.priority,
    assigneeMemberId: task.assignee_member_id,
    assigneeName: task.assignee_member_id
      ? (memberNames.get(task.assignee_member_id) ?? "Inactive member")
      : null,
    dueAt: task.due_at,
    completedAt: task.completed_at,
    firstCompletedAt: task.first_completed_at,
    createdByName: memberNames.get(task.created_by_member_id) ?? "Inactive member",
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getTasks } from "@/features/tasks/application/get-tasks";
import { TasksWorkspace } from "@/features/tasks/ui/tasks-workspace";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function TasksPage() {
  const member = await requireCurrentMember();
  const room = await getTasks(member);
  const activeCount = room.tasks.filter((task) => task.status !== "done").length;

  return (
    <>
      <PageHeader
        eyebrow="Tasks"
        title="Shared studio work"
        description="Plan together in Kanban, switch to a list for scanning, and award Studio XP on the first completion."
        action={
          <StatusPill tone={activeCount > 0 ? "info" : "neutral"}>
            {activeCount} active
          </StatusPill>
        }
      />
      <TasksWorkspace
        room={room}
        timezone={member.organization.timezone}
        nowMs={room.loadedAtMs}
      />
    </>
  );
}

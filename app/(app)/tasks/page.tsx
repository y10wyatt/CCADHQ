import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getTasks } from "@/features/tasks/application/get-tasks";
import { TasksWorkspace } from "@/features/tasks/ui/tasks-workspace";
import { getWeeklyQuests } from "@/features/weekly-quests/application/get-weekly-quests";
import { WeeklyQuestsPanel } from "@/features/weekly-quests/ui/weekly-quests-panel";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function TasksPage() {
  const member = await requireCurrentMember();
  const [room, weeklyQuests] = await Promise.all([
    getTasks(member),
    getWeeklyQuests(member),
  ]);
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
      <div className="grid gap-5">
        <WeeklyQuestsPanel
          quests={weeklyQuests}
          title="Weekly quests"
          description="Shared goals that sit above the task board."
        />
        <TasksWorkspace
          room={room}
          timezone={member.organization.timezone}
          nowMs={room.loadedAtMs}
        />
      </div>
    </>
  );
}

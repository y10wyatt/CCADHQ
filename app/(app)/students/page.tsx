import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getStudents } from "@/features/students/application/get-students";
import { StudentsWorkspace } from "@/features/students/ui/students-workspace";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function StudentsPage() {
  const member = await requireCurrentMember();
  const students = await getStudents(member);

  return (
    <>
      <PageHeader
        eyebrow="Students"
        title="Student studio records"
        description="Track current goals, follow-ups, posting permission, and class progress."
        action={<StatusPill tone="info">{students.length} active records</StatusPill>}
      />
      <StudentsWorkspace students={students} />
    </>
  );
}

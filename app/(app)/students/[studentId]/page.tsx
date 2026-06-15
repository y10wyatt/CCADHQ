import Link from "next/link";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getStudentDetail } from "@/features/students/application/get-students";
import { StudentDetailWorkspace } from "@/features/students/ui/student-detail-workspace";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const member = await requireCurrentMember();
  const detail = await getStudentDetail(member, studentId);

  return (
    <>
      <PageHeader
        eyebrow="Student detail"
        title={detail.student.name}
        description="Portfolio direction, parent context, class logs, and next actions."
        action={<StatusPill tone={detail.student.followUpNeeded ? "warning" : "neutral"}>{detail.student.status}</StatusPill>}
      />
      <Link
        href="/students"
        className="mb-5 inline-flex text-sm font-medium text-accent"
      >
        Back to Students
      </Link>
      <StudentDetailWorkspace
        student={detail.student}
        classLogs={detail.classLogs}
      />
    </>
  );
}

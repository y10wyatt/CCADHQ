import type {
  ClassLogTeacher,
  PermissionToPost,
  StudentProgram,
  StudentStatus,
} from "@/shared/database/database.types";

export type { ClassLogTeacher, PermissionToPost, StudentProgram, StudentStatus };

export const studentPrograms: StudentProgram[] = [
  "Portfolio",
  "AP Drawing",
  "Animation",
  "Trial",
  "Other",
];
export const studentStatuses: StudentStatus[] = [
  "Active",
  "Trial",
  "Paused",
  "Completed",
];
export const permissionOptions: PermissionToPost[] = ["Yes", "No", "Pending"];
export const classLogTeachers: ClassLogTeacher[] = [
  "William",
  "Alice",
  "Gerald",
  "Other",
];

export interface StudentView {
  id: string;
  name: string;
  grade: string;
  program: StudentProgram;
  status: StudentStatus;
  mainGoal: string;
  currentFocus: string;
  nextAction: string;
  nextClassDate: string | null;
  lastClassDate: string | null;
  followUpNeeded: boolean;
  permissionToPost: PermissionToPost;
  notes: string;
  strengths: string[];
  needsSupport: string[];
  applicationTargets: string[];
  parentNotes: string;
  paymentNotes: string;
}

export interface ClassLogView {
  id: string;
  studentId: string;
  date: string;
  teacher: ClassLogTeacher;
  duration: string;
  workedOn: string;
  feedbackGiven: string;
  homeworkAssigned: string;
  materialsNeeded: string;
  parentUpdateSent: boolean;
  nextClassFocus: string;
  imageUrl: string | null;
}

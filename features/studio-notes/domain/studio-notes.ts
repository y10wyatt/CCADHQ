import type {
  StudioNoteAuthor,
  StudioNoteCategory,
  StudioNotePriority,
} from "@/shared/database/database.types";

export type { StudioNoteAuthor, StudioNoteCategory, StudioNotePriority };

export interface StudioNote {
  id: string;
  text: string;
  author: StudioNoteAuthor;
  category: StudioNoteCategory;
  priority: StudioNotePriority;
  pinned: boolean;
  createdAt: string;
}

export const studioNoteAuthors: StudioNoteAuthor[] = [
  "William",
  "Alice",
  "Team",
];

export const studioNoteCategories: StudioNoteCategory[] = [
  "Reminder",
  "Content Idea",
  "Student Follow-up",
  "Admin",
  "Website",
  "Marketing",
  "Random",
];

export const studioNotePriorities: StudioNotePriority[] = [
  "Normal",
  "Important",
];

export function sortStudioNotes(notes: StudioNote[]) {
  return [...notes].sort((first, second) => {
    if (first.pinned !== second.pinned) {
      return first.pinned ? -1 : 1;
    }

    return second.createdAt.localeCompare(first.createdAt);
  });
}

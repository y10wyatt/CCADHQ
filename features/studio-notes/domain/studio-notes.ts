export type StudioNoteAuthor = "William" | "Alice" | "Team";

export type StudioNoteCategory =
  | "Reminder"
  | "Content Idea"
  | "Student Follow-up"
  | "Admin"
  | "Website"
  | "Marketing"
  | "Random";

export type StudioNotePriority = "Normal" | "Important";

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

export const initialStudioNotes: StudioNote[] = [
  {
    id: "studio-note-1",
    text: "Remember to photograph student process work this weekend.",
    author: "William",
    category: "Marketing",
    priority: "Important",
    pinned: true,
    createdAt: "2026-06-13",
  },
  {
    id: "studio-note-2",
    text: "Ask Alice if we should make a parent FAQ post about beginner students.",
    author: "William",
    category: "Content Idea",
    priority: "Normal",
    pinned: false,
    createdAt: "2026-06-13",
  },
  {
    id: "studio-note-3",
    text: "Need to confirm which student works can be posted publicly.",
    author: "Team",
    category: "Admin",
    priority: "Important",
    pinned: true,
    createdAt: "2026-06-12",
  },
  {
    id: "studio-note-4",
    text: "Add Marketing dashboard tab for account identities and content roadmap.",
    author: "William",
    category: "Website",
    priority: "Important",
    pinned: true,
    createdAt: "2026-06-12",
  },
];

export function sortStudioNotes(notes: StudioNote[]) {
  return [...notes].sort((first, second) => {
    if (first.pinned !== second.pinned) {
      return first.pinned ? -1 : 1;
    }

    return second.createdAt.localeCompare(first.createdAt);
  });
}

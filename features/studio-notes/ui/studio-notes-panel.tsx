"use client";

import { Pencil, Pin, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

import {
  initialStudioNotes,
  sortStudioNotes,
  studioNoteAuthors,
  studioNoteCategories,
  studioNotePriorities,
  type StudioNote,
  type StudioNoteAuthor,
  type StudioNoteCategory,
  type StudioNotePriority,
} from "@/features/studio-notes/domain/studio-notes";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

type StudioNoteFormInput = Omit<StudioNote, "id" | "createdAt">;

const emptyInput: StudioNoteFormInput = {
  text: "",
  author: "William",
  category: "Reminder",
  priority: "Normal",
  pinned: false,
};

export function StudioNotesPanel() {
  const [notes, setNotes] = useState<StudioNote[]>(initialStudioNotes);
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<StudioNote | null>(null);
  const sortedNotes = useMemo(() => sortStudioNotes(notes), [notes]);

  function beginAdd() {
    setEditingNote(null);
    setFormOpen(true);
  }

  function beginEdit(note: StudioNote) {
    setEditingNote(note);
    setFormOpen(true);
  }

  function saveNote(input: StudioNoteFormInput) {
    if (editingNote) {
      setNotes((current) =>
        current.map((note) =>
          note.id === editingNote.id ? { ...note, ...input } : note,
        ),
      );
    } else {
      setNotes((current) => [
        {
          ...input,
          id: `studio-note-${Date.now()}`,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...current,
      ]);
    }

    setFormOpen(false);
    setEditingNote(null);
  }

  function deleteNote(noteId: string) {
    setNotes((current) => current.filter((note) => note.id !== noteId));
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-[#fffefa] to-[#f7f0df]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill tone="info">Studio wall</StatusPill>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            Studio Notes
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Quick reminders, ideas, and loose updates between William, Alice,
            and the team.
          </p>
        </div>
        <Button onClick={beginAdd}>
          <Plus aria-hidden="true" />
          Add note
        </Button>
      </div>

      {formOpen && (
        <StudioNoteForm
          note={editingNote}
          onCancel={() => {
            setFormOpen(false);
            setEditingNote(null);
          }}
          onSubmit={saveNote}
        />
      )}

      <div className="mt-6">
        {sortedNotes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card/60 px-4 py-6 text-sm text-muted-foreground">
            No studio notes yet. Leave a note for the team.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sortedNotes.map((note, index) => (
              <StudioNoteCard
                key={note.id}
                note={note}
                rotation={noteRotation(index)}
                onEdit={() => beginEdit(note)}
                onDelete={() => deleteNote(note.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export function StudioNoteCard({
  note,
  rotation,
  onEdit,
  onDelete,
}: {
  note: StudioNote;
  rotation: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={cn(
        "relative min-h-56 rounded-md border bg-[#fff6d8] p-4 shadow-[0_12px_28px_rgb(80_67_35/0.12)] transition-transform hover:-translate-y-0.5",
        note.priority === "Important" ? "border-accent/60" : "border-[#ead9a5]",
        rotation,
      )}
    >
      {note.pinned && (
        <div className="absolute left-1/2 top-3 -translate-x-1/2 text-accent">
          <Pin className="size-4 fill-current" aria-hidden="true" />
          <span className="sr-only">Pinned</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 pt-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#d7bd78] bg-[#fffaf0] px-2.5 py-1 text-xs font-semibold text-[#755f24]">
            {note.category}
          </span>
          {note.priority === "Important" && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              Important
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            title="Edit note"
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/70 hover:text-foreground"
          >
            <Pencil className="size-4" aria-hidden="true" />
            <span className="sr-only">Edit note</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete note"
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/70 hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span className="sr-only">Delete note</span>
          </button>
        </div>
      </div>

      <p className="mt-4 text-base leading-7 text-foreground">{note.text}</p>

      <div className="mt-6 flex items-center justify-between border-t border-[#ead9a5] pt-3 text-xs font-medium text-muted-foreground">
        <span>{note.author}</span>
        <time dateTime={note.createdAt}>{formatNoteDate(note.createdAt)}</time>
      </div>
    </article>
  );
}

export function StudioNoteForm({
  note,
  onCancel,
  onSubmit,
}: {
  note: StudioNote | null;
  onCancel: () => void;
  onSubmit: (input: StudioNoteFormInput) => void;
}) {
  const [input, setInput] = useState<StudioNoteFormInput>(
    note
      ? {
          text: note.text,
          author: note.author,
          category: note.category,
          priority: note.priority,
          pinned: note.pinned,
        }
      : emptyInput,
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.text.trim();
    if (!text) {
      return;
    }

    onSubmit({ ...input, text });
  }

  return (
    <form
      onSubmit={submit}
      className="mt-5 rounded-lg border border-border bg-card/80 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">
            {note ? "Edit note" : "New studio note"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Keep it short, useful, and easy to scan later.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          title="Close form"
          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close form</span>
        </button>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-medium">
        Note
        <textarea
          value={input.text}
          onChange={(event) =>
            setInput((current) => ({ ...current, text: event.target.value }))
          }
          className={cn(fieldClass, "min-h-28 resize-y py-3 leading-6")}
          placeholder="Leave a note for the studio..."
          required
        />
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SelectField
          label="Author"
          value={input.author}
          options={studioNoteAuthors}
          onChange={(value) =>
            setInput((current) => ({
              ...current,
              author: value as StudioNoteAuthor,
            }))
          }
        />
        <SelectField
          label="Category"
          value={input.category}
          options={studioNoteCategories}
          onChange={(value) =>
            setInput((current) => ({
              ...current,
              category: value as StudioNoteCategory,
            }))
          }
        />
        <SelectField
          label="Priority"
          value={input.priority}
          options={studioNotePriorities}
          onChange={(value) =>
            setInput((current) => ({
              ...current,
              priority: value as StudioNotePriority,
            }))
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <input
            type="checkbox"
            checked={input.pinned}
            onChange={(event) =>
              setInput((current) => ({
                ...current,
                pinned: event.target.checked,
              }))
            }
            className="size-4 rounded border-border accent-[var(--accent)]"
          />
          Pin note
        </label>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{note ? "Save note" : "Add note"}</Button>
        </div>
      </div>
    </form>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function noteRotation(index: number) {
  const rotations = ["-rotate-1", "rotate-0", "rotate-1", "-rotate-[0.5deg]"];
  return rotations[index % rotations.length];
}

function formatNoteDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

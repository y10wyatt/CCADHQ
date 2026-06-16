"use client";

import { ExternalLink, Pencil, Pin, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  archiveResource,
  createResource,
  updateResource,
  type ResourceActionResult,
} from "@/features/resources/application/actions";
import {
  resourceCategories,
  resourceOwners,
  type ResourceCategory,
  type ResourceLink,
  type ResourceOwner,
} from "@/features/resources/domain/resources";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

export function ResourcesWorkspace({
  resources,
}: {
  resources: ResourceLink[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceLink | null>(
    null,
  );
  const [categoryFilter, setCategoryFilter] = useState<"All" | ResourceCategory>(
    "All",
  );
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return resources.filter((resource) => {
      const categoryMatches =
        categoryFilter === "All" || resource.category === categoryFilter;
      const queryMatches =
        !normalizedQuery ||
        [
          resource.title,
          resource.url,
          resource.description,
          resource.category,
          resource.owner,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return categoryMatches && queryMatches;
    });
  }, [categoryFilter, query, resources]);

  function runAction(
    action: () => Promise<ResourceActionResult>,
    successMessage: string,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Unable to update Resources.");
        return;
      }
      setMessage(successMessage);
      setFormOpen(false);
      setEditingResource(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Quick links</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep meeting notes, studio folders, references, and admin links in
              one place.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingResource(null);
              setFormOpen(true);
            }}
          >
            <Plus aria-hidden="true" />
            Add resource
          </Button>
        </div>

        {message && (
          <p className="mt-5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            {message}
          </p>
        )}

        {formOpen && (
          <ResourceForm
            disabled={isPending}
            resource={editingResource}
            onClose={() => {
              setFormOpen(false);
              setEditingResource(null);
            }}
            onSubmit={(input) =>
              runAction(
                () =>
                  editingResource
                    ? updateResource({
                        resourceId: editingResource.id,
                        ...input,
                      })
                    : createResource(input),
                editingResource ? "Resource updated." : "Resource added.",
              )
            }
          />
        )}

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="grid gap-1 text-sm font-medium text-muted-foreground">
            Search
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, link, category, owner..."
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-muted-foreground">
            Category
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as "All" | ResourceCategory)
              }
              className={fieldClass}
            >
              <option value="All">All categories</option>
              {resourceCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {filteredResources.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">
            No resources yet. Add the meeting notes link or any page you open
            often.
          </p>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              disabled={isPending}
              resource={resource}
              onEdit={() => {
                setEditingResource(resource);
                setFormOpen(true);
              }}
              onArchive={() =>
                runAction(
                  () => archiveResource(resource.id),
                  "Resource archived.",
                )
              }
            />
          ))}
        </section>
      )}
    </div>
  );
}

function ResourceCard({
  resource,
  disabled,
  onEdit,
  onArchive,
}: {
  resource: ResourceLink;
  disabled: boolean;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <Card
      className={cn(
        "flex h-full flex-col gap-4",
        resource.pinned && "border-accent/40 bg-blue-50/35",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{resource.title}</h3>
            {resource.pinned && (
              <StatusPill tone="info">
                <Pin className="size-3" aria-hidden="true" />
                Pinned
              </StatusPill>
            )}
          </div>
          <p className="mt-1 break-all text-xs text-muted-foreground">
            {resource.url}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={disabled}
            onClick={onEdit}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-4" aria-hidden="true" />
            <span className="sr-only">Edit {resource.title}</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onArchive}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span className="sr-only">Archive {resource.title}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill tone="neutral">{resource.category}</StatusPill>
        <StatusPill tone="neutral">{resource.owner}</StatusPill>
      </div>

      {resource.description && (
        <p className="text-sm leading-6 text-muted-foreground">
          {resource.description}
        </p>
      )}

      <a
        href={resource.url}
        target="_blank"
        rel="noreferrer"
        className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-accent/50 hover:bg-muted"
      >
        Open link
        <ExternalLink className="size-4" aria-hidden="true" />
      </a>
    </Card>
  );
}

function ResourceForm({
  resource,
  disabled,
  onClose,
  onSubmit,
}: {
  resource: ResourceLink | null;
  disabled: boolean;
  onClose: () => void;
  onSubmit: (input: ResourceFormInput) => void;
}) {
  const [input, setInput] = useState<ResourceFormInput>(
    resource
      ? {
          title: resource.title,
          url: resource.url,
          category: resource.category,
          description: resource.description,
          owner: resource.owner,
          pinned: resource.pinned,
        }
      : {
          title: "",
          url: "",
          category: "Meetings",
          description: "",
          owner: "Team",
          pinned: true,
        },
  );

  return (
    <form
      className="mt-5 rounded-lg border border-border bg-background/70 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(input);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold">
          {resource ? "Edit resource" : "New resource"}
        </h3>
        <button
          type="button"
          disabled={disabled}
          onClick={onClose}
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close resource form</span>
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextField
          label="Title"
          value={input.title}
          onChange={(title) => setInput((current) => ({ ...current, title }))}
        />
        <TextField
          label="URL"
          type="url"
          value={input.url}
          placeholder="https://docs.google.com/..."
          onChange={(url) => setInput((current) => ({ ...current, url }))}
        />
        <SelectField
          label="Category"
          value={input.category}
          options={resourceCategories}
          onChange={(category) =>
            setInput((current) => ({
              ...current,
              category: category as ResourceCategory,
            }))
          }
        />
        <SelectField
          label="Owner"
          value={input.owner}
          options={resourceOwners}
          onChange={(owner) =>
            setInput((current) => ({
              ...current,
              owner: owner as ResourceOwner,
            }))
          }
        />
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
          Pin to top
        </label>
        <TextArea
          label="Description"
          value={input.description}
          onChange={(description) =>
            setInput((current) => ({ ...current, description }))
          }
        />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" disabled={disabled} onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={disabled || !input.title.trim() || !input.url.trim()}
        >
          {resource ? "Save resource" : "Create resource"}
        </Button>
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-muted-foreground">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-muted-foreground lg:col-span-2">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClass, "min-h-24 py-2")}
      />
    </label>
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
    <label className="grid gap-1 text-sm font-medium text-muted-foreground">
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

interface ResourceFormInput {
  title: string;
  url: string;
  category: ResourceCategory;
  description: string;
  owner: ResourceOwner;
  pinned: boolean;
}

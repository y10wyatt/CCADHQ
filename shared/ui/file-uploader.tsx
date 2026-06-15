"use client";

import { FileUp, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { StatusPill } from "@/shared/ui/status-pill";

interface LocalUploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export function FileUploader({
  title,
  description,
  accept = "image/*,video/*,.pdf",
}: {
  title: string;
  description: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<LocalUploadFile[]>([]);
  const totalSize = useMemo(
    () => files.reduce((total, file) => total + file.size, 0),
    [files],
  );

  function addFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    setFiles((current) => [
      ...Array.from(fileList).map((file) => ({
        id: `${file.name}-${file.lastModified}-${file.size}`,
        name: file.name,
        size: file.size,
        type: file.type || "File",
      })),
      ...current,
    ]);
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-background/70 p-4">
      <div
        className="rounded-md border border-border bg-card p-5"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-muted text-accent">
              <FileUp className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Select files
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <StatusPill tone={files.length > 0 ? "info" : "neutral"}>
          {files.length} staged
        </StatusPill>
        <p className="text-xs text-muted-foreground">
          Local preview only | {formatBytes(totalSize)}
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-3 grid gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm",
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.type} | {formatBytes(file.size)}
                </p>
              </div>
              <button
                type="button"
                title="Remove staged file"
                className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() =>
                  setFiles((current) =>
                    current.filter((currentFile) => currentFile.id !== file.id),
                  )
                }
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Remove staged file</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatBytes(size: number) {
  if (size === 0) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );
  return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

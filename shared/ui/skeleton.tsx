import { cn } from "@/shared/lib/cn";

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className,
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[0_14px_40px_rgb(31_59_93/0.08)]">
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonBlock className="mt-5 h-8 w-36" />
      <SkeletonBlock className="mt-3 h-4 w-full" />
      <SkeletonBlock className="mt-2 h-4 w-2/3" />
    </div>
  );
}

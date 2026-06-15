import { CardSkeleton, SkeletonBlock } from "@/shared/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <div aria-label="Loading workspace" className="grid gap-5">
      <div className="rounded-xl border border-border bg-card p-6">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="mt-4 h-9 w-72 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <CardSkeleton key={item} />
        ))}
      </section>
      <SkeletonBlock className="h-72 rounded-xl" />
    </div>
  );
}

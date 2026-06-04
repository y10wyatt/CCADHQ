import { Card } from "@/shared/ui/card";

export default function WorkspaceLoading() {
  return (
    <div aria-label="Loading workspace" className="grid animate-pulse gap-5">
      <div className="h-24 rounded-xl bg-muted" />
      <section className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Card key={item} className="h-40 bg-muted/50" />
        ))}
      </section>
      <Card className="h-72 bg-muted/50" />
    </div>
  );
}

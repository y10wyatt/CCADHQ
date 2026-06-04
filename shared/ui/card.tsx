import { cn } from "@/shared/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 text-card-foreground shadow-[0_18px_60px_rgb(0_0_0/0.14)]",
        className,
      )}
      {...props}
    />
  );
}

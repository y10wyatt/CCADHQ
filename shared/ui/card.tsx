import { cn } from "@/shared/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 text-card-foreground shadow-[0_14px_40px_rgb(31_59_93/0.08)]",
        className,
      )}
      {...props}
    />
  );
}

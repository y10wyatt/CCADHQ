import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

const statusPillVariants = cva(
  "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-muted-foreground",
        info: "border-accent/30 bg-accent/10 text-accent",
        success: "border-success/30 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/10 text-warning",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusPillVariants> {}

export function StatusPill({
  className,
  tone,
  ...props
}: StatusPillProps) {
  return (
    <span className={cn(statusPillVariants({ tone }), className)} {...props} />
  );
}

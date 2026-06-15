import { cn } from "@/shared/lib/cn";

export interface ChartDatum {
  label: string;
  value: number;
  tone?: "info" | "success" | "warning" | "neutral";
}

const chartToneClasses: Record<NonNullable<ChartDatum["tone"]>, string> = {
  info: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  neutral: "bg-muted-foreground",
};

export function MiniBarChart({
  data,
  valueFormatter = (value) => String(value),
}: {
  data: ChartDatum[];
  valueFormatter?: (value: number) => string;
}) {
  const maximum = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="grid gap-4">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="font-mono text-muted-foreground">
              {valueFormatter(item.value)}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                chartToneClasses[item.tone ?? "info"],
              )}
              style={{ width: `${Math.max((item.value / maximum) * 100, 3)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MiniLineChart({ data }: { data: ChartDatum[] }) {
  const maximum = Math.max(...data.map((item) => item.value), 1);
  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
      const y = 100 - (item.value / maximum) * 86 - 7;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-lg border border-border bg-background/70 p-4">
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label="Trend chart"
        className="h-32 w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="var(--accent)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((item, index) => {
          const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
          const y = 100 - (item.value / maximum) * 86 - 7;
          return (
            <circle
              key={item.label}
              cx={x}
              cy={y}
              r="2.5"
              fill="var(--card)"
              stroke="var(--accent)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        {data.slice(0, 3).map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

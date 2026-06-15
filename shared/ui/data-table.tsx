import { cn } from "@/shared/lib/cn";

interface DataTableColumn<Row> {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
  render: (row: Row) => React.ReactNode;
}

interface DataTableProps<Row> {
  title: string;
  description: string;
  rows: Row[];
  columns: Array<DataTableColumn<Row>>;
  emptyMessage: string;
  getRowKey: (row: Row) => string;
  minWidth?: string;
  action?: React.ReactNode;
}

export function DataTable<Row>({
  title,
  description,
  rows,
  columns,
  emptyMessage,
  getRowKey,
  minWidth = "900px",
  action,
}: DataTableProps<Row>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card text-card-foreground shadow-[0_14px_40px_rgb(31_59_93/0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-5">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-5 py-4 font-medium",
                  column.align === "right" && "text-right",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="align-top">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-5 py-4",
                    column.align === "right" && "text-right",
                    column.className,
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="p-6 text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}

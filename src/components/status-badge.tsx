import type { OrderStatus } from "@/lib/mock-data";
import { statusLabel } from "@/lib/mock-data";

const styles: Record<OrderStatus, { dot: string; text: string; bg: string }> = {
  pending:    { dot: "bg-[oklch(0.78_0.15_75)]",  text: "text-[oklch(0.85_0.12_75)]",  bg: "bg-[oklch(0.78_0.15_75)]/10 border-[oklch(0.78_0.15_75)]/20" },
  in_review:  { dot: "bg-[oklch(0.72_0.14_235)]", text: "text-[oklch(0.82_0.11_235)]", bg: "bg-[oklch(0.72_0.14_235)]/10 border-[oklch(0.72_0.14_235)]/20" },
  approved:   { dot: "bg-[oklch(0.72_0.16_155)]", text: "text-[oklch(0.82_0.13_155)]", bg: "bg-[oklch(0.72_0.16_155)]/10 border-[oklch(0.72_0.16_155)]/20" },
  production: { dot: "bg-[oklch(0.72_0.16_295)]", text: "text-[oklch(0.82_0.13_295)]", bg: "bg-[oklch(0.72_0.16_295)]/10 border-[oklch(0.72_0.16_295)]/20" },
  completed:  { dot: "bg-muted-foreground",       text: "text-muted-foreground",       bg: "bg-muted border-border" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {statusLabel[status]}
    </span>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ArrowUp, ArrowDown } from "lucide-react";
import { analytics, orders, statusOrder, statusLabel } from "@/lib/mock-data";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Pathorize Admin" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const statusCounts = statusOrder.map((s) => ({
    status: s,
    count: orders.filter((o) => o.status === s).length,
  }));
  const maxStatus = Math.max(...statusCounts.map((s) => s.count));

  const maxWeek = Math.max(...analytics.weeklyRevenue);

  return (
    <div className="px-8 py-7 max-w-[1400px] mx-auto">
      <PageHeader title="Analytics" description="Performance across the Pathorize business." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Stat label="Revenue" value={`$${analytics.revenue.toLocaleString()}`} change={analytics.revenueChange} />
        <Stat label="Orders" value={analytics.orderCount.toString()} change={analytics.orderChange} />
        <Stat label="Avg Order Value" value={`$${analytics.aov.toFixed(2)}`} change={analytics.aovChange} />
        <Stat label="Conversion Rate" value={`${analytics.conversion}%`} change={analytics.conversionChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        {/* Revenue chart */}
        <div className="surface-card lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm font-medium">Revenue</div>
              <div className="text-xs text-muted-foreground mt-0.5">Last 12 weeks</div>
            </div>
            <div className="text-xs text-muted-foreground">Weekly</div>
          </div>
          <div className="flex items-end gap-2 h-48">
            {analytics.weeklyRevenue.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-[oklch(0.55_0.14_255)] to-[oklch(0.78_0.14_255)] transition hover:opacity-80"
                  style={{ height: `${(v / maxWeek) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by status */}
        <div className="surface-card p-6">
          <div className="text-sm font-medium">Orders by Status</div>
          <div className="text-xs text-muted-foreground mt-0.5 mb-5">Current pipeline</div>
          <div className="space-y-3.5">
            {statusCounts.map((s) => (
              <div key={s.status}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{statusLabel[s.status]}</span>
                  <span className="tabular-nums font-medium">{s.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground/80"
                    style={{ width: `${(s.count / maxStatus) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top races */}
      <div className="surface-card mt-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="text-sm font-medium">Top Selling Races</div>
          <div className="text-xs text-muted-foreground mt-0.5">By order volume this quarter</div>
        </div>
        <div className="grid grid-cols-[2fr_1fr_1fr_2fr] gap-4 px-5 py-3 border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          <div>Race</div><div className="text-right">Orders</div><div className="text-right">Revenue</div><div>Share</div>
        </div>
        {analytics.topRaces.map((r) => {
          const max = analytics.topRaces[0].count;
          return (
            <div key={r.race} className="grid grid-cols-[2fr_1fr_1fr_2fr] gap-4 px-5 py-3 items-center border-b border-border/60 last:border-0">
              <div className="text-sm">{r.race}</div>
              <div className="text-sm text-right tabular-nums">{r.count}</div>
              <div className="text-sm text-right tabular-nums font-medium">${r.revenue.toLocaleString()}</div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[oklch(0.55_0.14_255)] to-[oklch(0.78_0.14_255)]" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, change }: { label: string; value: string; change: number }) {
  const positive = change >= 0;
  return (
    <div className="surface-card p-5">
      <div className="text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-2">{value}</div>
      <div className={`mt-1.5 inline-flex items-center gap-1 text-xs ${positive ? "text-[oklch(0.78_0.14_155)]" : "text-[oklch(0.72_0.18_25)]"}`}>
        {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {Math.abs(change)}% <span className="text-muted-foreground ml-1">vs last month</span>
      </div>
    </div>
  );
}

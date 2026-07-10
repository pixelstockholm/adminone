import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown } from "lucide-react";
import { statusOrder, statusLabel } from "@/lib/mock-data";
import { PageHeader } from "@/components/page-header";
import { listOrders } from "@/lib/orders.functions";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Racepace Admin" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => listOrders(),
  });
  const revenue = orders.reduce((sum, order) => sum + order.price, 0);
  const orderCount = orders.length;
  const averageOrderValue = orderCount ? revenue / orderCount : 0;
  const statusCounts = statusOrder.map((s) => ({
    status: s,
    count: orders.filter((o) => o.status === s).length,
  }));
  const maxStatus = Math.max(1, ...statusCounts.map((s) => s.count));

  const weeklyRevenue = buildWeeklyRevenue(orders);
  const maxWeek = Math.max(1, ...weeklyRevenue.map((week) => week.revenue));
  const topRaces = buildTopRaces(orders);

  return (
    <div className="px-8 py-7 max-w-[1400px] mx-auto">
      <PageHeader title="Analytics" description="Performance across the Racepace business." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Stat label="Revenue" value={`$${revenue.toLocaleString()}`} />
        <Stat label="Orders" value={orderCount.toString()} />
        <Stat label="Avg Order Value" value={`$${averageOrderValue.toFixed(2)}`} />
        <Stat
          label="In Production"
          value={String(statusCounts.find((s) => s.status === "production")?.count ?? 0)}
        />
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
            {weeklyRevenue.map((week, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-[oklch(0.55_0.14_255)] to-[oklch(0.78_0.14_255)] transition hover:opacity-80"
                  style={{ height: `${(week.revenue / maxWeek) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{week.label}</span>
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
          <div>Race</div>
          <div className="text-right">Orders</div>
          <div className="text-right">Revenue</div>
          <div>Share</div>
        </div>
        {topRaces.map((r) => {
          const max = topRaces[0]?.count || 1;
          return (
            <div
              key={r.race}
              className="grid grid-cols-[2fr_1fr_1fr_2fr] gap-4 px-5 py-3 items-center border-b border-border/60 last:border-0"
            >
              <div className="text-sm">{r.race}</div>
              <div className="text-sm text-right tabular-nums">{r.count}</div>
              <div className="text-sm text-right tabular-nums font-medium">
                ${r.revenue.toLocaleString()}
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[oklch(0.55_0.14_255)] to-[oklch(0.78_0.14_255)]"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
        {topRaces.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No order data yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, change }: { label: string; value: string; change?: number }) {
  if (typeof change !== "number") {
    return (
      <div className="surface-card p-5">
        <div className="text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
        <div className="text-2xl font-semibold tabular-nums mt-2">{value}</div>
        <div className="mt-1.5 text-xs text-muted-foreground">Live order data</div>
      </div>
    );
  }
  const positive = change >= 0;
  return (
    <div className="surface-card p-5">
      <div className="text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-2">{value}</div>
      <div
        className={`mt-1.5 inline-flex items-center gap-1 text-xs ${positive ? "text-[oklch(0.78_0.14_155)]" : "text-[oklch(0.72_0.18_25)]"}`}
      >
        {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {Math.abs(change)}% <span className="text-muted-foreground ml-1">vs last month</span>
      </div>
    </div>
  );
}

function buildWeeklyRevenue(orders: Awaited<ReturnType<typeof listOrders>>) {
  const weeks = Array.from({ length: 12 }, (_, index) => ({
    label: `W${index + 1}`,
    revenue: 0,
  }));
  const sorted = [...orders].sort((a, b) => a.orderedAt.localeCompare(b.orderedAt));
  sorted.forEach((order, index) => {
    const bucket = Math.min(11, Math.floor((index / Math.max(1, sorted.length)) * 12));
    weeks[bucket].revenue += order.price;
  });
  return weeks;
}

function buildTopRaces(orders: Awaited<ReturnType<typeof listOrders>>) {
  const map = new Map<string, { race: string; count: number; revenue: number }>();
  for (const order of orders) {
    const current = map.get(order.race) ?? { race: order.race, count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += order.price;
    map.set(order.race, current);
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

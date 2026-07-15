import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { statusOrder, statusLabel, type OrderStatus } from "@/lib/mock-data";
import { listOrders } from "@/lib/orders.functions";
import { OrderPoster } from "@/components/poster-preview";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { formatSek } from "@/lib/currency";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orders · Racepace Admin" },
      {
        name: "description",
        content: "Manage Racepace marathon poster orders through production.",
      },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => listOrders(),
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const s of statusOrder) c[s] = orders.filter((o) => o.status === s).length;
    return c;
  }, [orders]);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="px-8 py-7 max-w-[1400px] mx-auto">
      <PageHeader
        title="Orders"
        description="Manage poster orders through the production workflow."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border rounded-xl overflow-hidden mt-6 border border-border">
        {(["all", ...statusOrder] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as OrderStatus | "all")}
            className={`text-left px-5 py-4 bg-card transition hover:bg-accent ${
              filter === s ? "bg-accent" : ""
            }`}
          >
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {s === "all" ? "All orders" : statusLabel[s as OrderStatus]}
            </div>
            <div className="text-2xl font-semibold mt-1 tabular-nums">{counts[s] ?? 0}</div>
          </button>
        ))}
      </div>

      <div className="surface-card mt-6 overflow-hidden">
        <div className="grid grid-cols-[64px_1.5fr_1.4fr_0.8fr_0.7fr_0.9fr_0.8fr_28px] gap-4 px-5 py-3 border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          <div>Preview</div>
          <div>Order</div>
          <div>Customer</div>
          <div>Time</div>
          <div>Size</div>
          <div>Status</div>
          <div className="text-right">Price</div>
          <div />
        </div>
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="py-16 px-6 text-center">
            <div className="font-serif text-2xl text-foreground">No real orders yet.</div>
            <p className="max-w-md mx-auto mt-2 text-sm text-muted-foreground leading-6">
              Adminone now hides seed/demo orders by default. Place a Shopify test order and the
              webhook will create the first production-ready order here.
            </p>
          </div>
        )}
        {filtered.map((o) => (
          <Link
            key={o.id}
            to="/orders/$orderId"
            params={{ orderId: o.id }}
            className="grid grid-cols-[64px_1.5fr_1.4fr_0.8fr_0.7fr_0.9fr_0.8fr_28px] gap-4 px-5 py-3 items-center border-b border-border/60 last:border-0 hover:bg-accent/40 transition group"
          >
            <div className="w-12">
              <OrderPoster order={o} size="sm" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {o.race} {o.year}
              </div>
              <div className="text-xs text-muted-foreground font-mono">{o.number}</div>
            </div>
            <div className="min-w-0">
              <div className="text-sm truncate">{o.customer.name}</div>
              <div className="text-xs text-muted-foreground truncate">{o.customer.location}</div>
            </div>
            <div className="text-sm font-mono tabular-nums">{o.time}</div>
            <div className="text-sm text-muted-foreground">{o.size}</div>
            <div>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-sm text-right tabular-nums font-medium">{formatSek(o.price)}</div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
          </Link>
        ))}
      </div>
    </div>
  );
}

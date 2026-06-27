import { createFileRoute } from "@tanstack/react-router";
import { orders } from "@/lib/mock-data";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers · Racepace Admin" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const map = new Map<string, { name: string; email: string; location: string; orders: number; spent: number; last: string }>();
  for (const o of orders) {
    const k = o.customer.email;
    const cur = map.get(k);
    if (cur) {
      cur.orders += 1;
      cur.spent += o.price;
      if (o.orderedAt > cur.last) cur.last = o.orderedAt;
    } else {
      map.set(k, { ...o.customer, orders: 1, spent: o.price, last: o.orderedAt });
    }
  }
  const customers = Array.from(map.values()).sort((a, b) => b.spent - a.spent);

  return (
    <div className="px-8 py-7 max-w-[1400px] mx-auto">
      <PageHeader title="Customers" description="Everyone who's ordered a Racepace poster." />

      <div className="surface-card mt-6 overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1.6fr_1fr_0.8fr_0.8fr] gap-4 px-5 py-3 border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          <div>Name</div><div>Email</div><div>Location</div><div className="text-right">Orders</div><div className="text-right">Spent</div>
        </div>
        {customers.map((c) => (
          <div key={c.email} className="grid grid-cols-[1.4fr_1.6fr_1fr_0.8fr_0.8fr] gap-4 px-5 py-3 items-center border-b border-border/60 last:border-0 hover:bg-accent/40 transition">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-[oklch(0.72_0.16_255)] to-[oklch(0.62_0.18_295)] grid place-items-center text-[11px] font-semibold">
                {c.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <span className="text-sm truncate">{c.name}</span>
            </div>
            <div className="text-sm text-muted-foreground truncate">{c.email}</div>
            <div className="text-sm text-muted-foreground truncate">{c.location}</div>
            <div className="text-sm text-right tabular-nums">{c.orders}</div>
            <div className="text-sm text-right tabular-nums font-medium">${c.spent}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

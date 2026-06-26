import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, RefreshCw, Send, Mail, MapPin, Calendar, Palette, Ruler } from "lucide-react";
import { getOrder } from "@/lib/mock-data";
import { OrderPoster } from "@/components/poster-preview";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/orders/$orderId")({
  head: ({ params }) => ({
    meta: [{ title: `Order ${params.orderId} · Pathorize Admin` }],
  }),
  loader: ({ params }) => {
    const order = getOrder(params.orderId);
    if (!order) throw notFound();
    return { order };
  },
  component: OrderDetail,
  notFoundComponent: () => (
    <div className="p-10 text-sm text-muted-foreground">Order not found.</div>
  ),
});

function OrderDetail() {
  const { order } = Route.useLoaderData();
  const [notes, setNotes] = useState(order.notes ?? "");

  return (
    <div className="px-8 py-7 max-w-[1400px] mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
      </Link>

      <div className="flex items-start justify-between mt-4 pb-6 border-b border-border/70">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold tracking-tight">{order.race} {order.year}</h1>
            <StatusBadge status={order.status} />
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-1">{order.number} · Ordered {order.orderedAt}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface hover:bg-accent text-xs font-medium transition">
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface hover:bg-accent text-xs font-medium transition">
            <Check className="h-3.5 w-3.5" /> Approve
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background hover:opacity-90 text-xs font-medium transition">
            <Send className="h-3.5 w-3.5" /> Send to Production
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 mt-6">
        {/* Poster preview */}
        <div className="surface-card p-8 flex items-center justify-center bg-gradient-to-br from-surface to-card">
          <div className="w-full max-w-md shadow-2xl shadow-black/40 rounded-md">
            <OrderPoster order={order} size="xl" />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="surface-card">
            <div className="px-5 py-3.5 border-b border-border text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Customer
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[oklch(0.72_0.16_255)] to-[oklch(0.62_0.18_295)] grid place-items-center text-sm font-semibold">
                  {order.customer.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-medium">{order.customer.name}</div>
                  <div className="text-xs text-muted-foreground">{order.customer.location}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/60">
                <Row icon={Mail} label="Email" value={order.customer.email} />
                <Row icon={MapPin} label="Ship to" value={order.customer.location} />
              </div>
            </div>
          </div>

          <div className="surface-card">
            <div className="px-5 py-3.5 border-b border-border text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Poster Details
            </div>
            <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-3">
              <Row icon={Calendar} label="Race" value={order.race} />
              <Row icon={Calendar} label="Date" value={order.date} />
              <Row icon={Ruler} label="Finish time" value={order.time} mono />
              <Row icon={Ruler} label="Size" value={order.size} />
              <Row icon={Palette} label="Theme" value={order.theme.name} />
              <Row icon={Ruler} label="Price" value={`$${order.price}`} />
            </div>
          </div>

          <div className="surface-card">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Notes</span>
              <button className="text-xs text-muted-foreground hover:text-foreground">Save</button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this order…"
              className="w-full bg-transparent p-5 text-sm resize-none outline-none min-h-[120px] placeholder:text-muted-foreground/70"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, mono }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={`text-sm truncate ${mono ? "font-mono tabular-nums" : ""}`}>{value}</div>
      </div>
    </div>
  );
}

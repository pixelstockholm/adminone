import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Send,
  Mail,
  MapPin,
  Calendar,
  Palette,
  Ruler,
  Loader2,
  Download,
} from "lucide-react";
import {
  getOrderById,
  getOrderPrintExport,
  saveOrderNotes,
  sendOrderToProduction,
  updateOrderStatus,
} from "@/lib/orders.functions";
import { OrderPoster } from "@/components/poster-preview";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/$orderId")({
  head: ({ params }) => ({
    meta: [{ title: `Order ${params.orderId} · Racepace Admin` }],
  }),
  component: OrderDetail,
  notFoundComponent: () => (
    <div className="p-10 text-sm text-muted-foreground">Order not found.</div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-muted-foreground">Failed to load: {error.message}</div>
  ),
});

function OrderDetail() {
  const { orderId } = Route.useParams();
  const qc = useQueryClient();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById({ data: { id: orderId } }),
  });

  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (order) setNotes(order.notes ?? "");
  }, [order]);

  const statusMut = useMutation({
    mutationFn: (status: "approved" | "production") =>
      updateOrderStatus({ data: { id: orderId, status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const productionMut = useMutation({
    mutationFn: () => sendOrderToProduction({ data: { id: orderId } }),
    onSuccess: () => {
      toast.success("Order sent to production");
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast.error("Could not send to production", {
        description:
          error instanceof Error ? error.message : "Check the print provider integration.",
      });
    },
  });

  const exportMut = useMutation({
    mutationFn: () => getOrderPrintExport({ data: { id: orderId } }),
    onSuccess: (file) => {
      const blob = new Blob([file.svg], { type: file.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Print file exported", {
        description: `${file.size.label} · ${file.dpi} DPI · ${file.size.widthPx}×${file.size.heightPx}px`,
      });
    },
    onError: (error) => {
      toast.error("Could not export print file", {
        description: error instanceof Error ? error.message : "Check the order data.",
      });
    },
  });

  const notesMut = useMutation({
    mutationFn: () => saveOrderNotes({ data: { id: orderId, notes } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order", orderId] }),
  });

  if (isLoading) {
    return (
      <div className="p-10 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading order…
      </div>
    );
  }
  if (!order) throw notFound();

  return (
    <div className="px-8 py-7 max-w-[1400px] mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
      </Link>

      <div className="flex items-start justify-between mt-4 pb-6 border-b border-border/70">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold tracking-tight">
              {order.race} {order.year}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-1">
            {order.number} · Ordered {order.orderedAt}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportMut.mutate()}
            disabled={exportMut.isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface hover:bg-accent text-xs font-medium transition disabled:opacity-50"
          >
            {exportMut.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Export Print SVG
          </button>
          <button
            onClick={() => statusMut.mutate("approved")}
            disabled={statusMut.isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface hover:bg-accent text-xs font-medium transition disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> Approve
          </button>
          <button
            onClick={() => productionMut.mutate()}
            disabled={productionMut.isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background hover:opacity-90 text-xs font-medium transition disabled:opacity-50"
          >
            {productionMut.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Send to Production
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 mt-6">
        <div className="surface-card p-8 flex items-center justify-center bg-gradient-to-br from-surface to-card">
          <div className="w-full max-w-md shadow-2xl shadow-black/40 rounded-md">
            <OrderPoster order={order} size="xl" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-card">
            <div className="px-5 py-3.5 border-b border-border text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Customer
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[oklch(0.72_0.16_255)] to-[oklch(0.62_0.18_295)] grid place-items-center text-sm font-semibold">
                  {order.customer.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
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
              {order.raceId && <Row icon={Calendar} label="Race ID" value={order.raceId} mono />}
              <Row icon={Calendar} label="Date" value={order.date} />
              <Row icon={Ruler} label="Finish time" value={order.time} mono />
              <Row icon={Ruler} label="Size" value={order.size} />
              <Row icon={Palette} label="Theme" value={order.theme.name} />
              <Row icon={Ruler} label="Price" value={`$${order.price}`} />
              {typeof order.routeVerified === "boolean" && (
                <Row
                  icon={Check}
                  label="Route"
                  value={order.routeVerified ? "Verified" : "Unverified"}
                />
              )}
              {order.productionSentAt && (
                <Row
                  icon={Send}
                  label="Sent to print"
                  value={order.productionSentAt.slice(0, 10)}
                />
              )}
            </div>
          </div>

          <div className="surface-card">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Notes
              </span>
              <button
                onClick={() => notesMut.mutate()}
                disabled={notesMut.isPending}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {notesMut.isPending ? "Saving…" : "Save"}
              </button>
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

function Row({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
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

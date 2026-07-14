import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  createProductionPngUpload,
  saveOrderNotes,
  sendOrderToProduction,
  updateOrderStatus,
} from "@/lib/orders.functions";
import { OrderPoster } from "@/components/poster-preview";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "sonner";
import { POSTER_FONT_STYLESHEET_URL } from "@/lib/poster-fonts";

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
  const posterRef = useRef<HTMLDivElement>(null);
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById({ data: { id: orderId } }),
  });

  const [notes, setNotes] = useState("");
  const [isExportingPreview, setIsExportingPreview] = useState(false);
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
    mutationFn: async () => {
      if (!posterRef.current) throw new Error("Poster preview was not found.");

      const file = await renderPosterNodeToPng(posterRef.current, order?.size || "30x40cm");
      const gateToken = window.localStorage.getItem("racepace-gate-token") || undefined;
      const upload = await createProductionPngUpload({ data: { id: orderId, gateToken } });
      const uploadBody = new FormData();
      uploadBody.append("cacheControl", "3600");
      uploadBody.append("", file.blob, "preview-300dpi.png");
      const uploadResponse = await fetch(upload.signedUrl, {
        method: "PUT",
        headers: { "x-upsert": "true" },
        body: uploadBody,
      });
      if (!uploadResponse.ok) {
        const detail = await uploadResponse.text();
        throw new Error(
          `Could not upload production PNG (${uploadResponse.status})${detail ? `: ${detail}` : "."}`,
        );
      }

      return sendOrderToProduction({ data: { id: orderId, gateToken } });
    },
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
  const shippingLines = [
    order.shipping?.name,
    order.shipping?.address1,
    order.shipping?.address2,
    [order.shipping?.postalCode, order.shipping?.city].filter(Boolean).join(" "),
    [order.shipping?.province, order.shipping?.countryCode || order.shipping?.country]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);
  const hasPrintAddress = Boolean(
    order.shipping?.address1 &&
    order.shipping?.city &&
    order.shipping?.postalCode &&
    order.shipping?.countryCode,
  );
  const isRealShopifyOrder = Boolean(order.shopifyOrderId);
  const canSendToProduction =
    isRealShopifyOrder &&
    hasPrintAddress &&
    order.status === "approved" &&
    order.routeVerified === true &&
    !order.productionSentAt;
  const productionBlocker = !isRealShopifyOrder
    ? "This is a demo/imported order. Send a Shopify test order first."
    : !hasPrintAddress
      ? "Missing full shipping address from Shopify checkout."
      : order.status !== "approved"
        ? "Approve this order before sending it to production."
        : order.routeVerified !== true
          ? "Verify the race route before sending it to production."
          : order.productionSentAt
            ? "This order has already been sent to production."
            : null;

  const handlePreviewExport = async () => {
    if (!posterRef.current) return;
    setIsExportingPreview(true);
    try {
      const file = await renderPosterNodeToPng(posterRef.current, order.size);
      downloadBlob(
        file.blob,
        `${safeFilePart(order.number)}-${safeFilePart(order.raceId || order.raceShort)}-${file.size.key}.png`,
      );
      toast.success("Preview PNG exported", {
        description: `${file.size.label} · 300 DPI · ${file.size.widthPx}x${file.size.heightPx}px`,
      });
    } catch (error) {
      toast.error("Could not export preview PNG", {
        description:
          error instanceof Error ? error.message : "Try again after the poster preview has loaded.",
      });
    } finally {
      setIsExportingPreview(false);
    }
  };

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
            onClick={handlePreviewExport}
            disabled={isExportingPreview}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface hover:bg-accent text-xs font-medium transition disabled:opacity-50"
          >
            {isExportingPreview ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Export Preview PNG
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
            disabled={productionMut.isPending || !canSendToProduction}
            title={productionBlocker ?? "Send order to print provider"}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background hover:opacity-90 text-xs font-medium transition disabled:opacity-50"
          >
            {productionMut.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {canSendToProduction ? "Send to Production" : "Production Locked"}
          </button>
        </div>
      </div>

      {productionBlocker && (
        <div className="mt-5 rounded-lg border border-[oklch(0.78_0.15_75)]/25 bg-[oklch(0.78_0.15_75)]/10 px-4 py-3 text-sm text-[oklch(0.86_0.11_75)]">
          <span className="font-medium">Production locked:</span> {productionBlocker}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 mt-6">
        <div className="surface-card p-8 flex items-center justify-center bg-gradient-to-br from-surface to-card">
          <div ref={posterRef} className="w-full max-w-md shadow-2xl shadow-black/40 rounded-md">
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
                <Row
                  icon={MapPin}
                  label={hasPrintAddress ? "Print address" : "Print address missing"}
                  value={
                    shippingLines.length
                      ? shippingLines.join(" · ")
                      : "Missing full shipping address"
                  }
                />
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

type ExportSize = {
  key: string;
  label: string;
  widthPx: number;
  heightPx: number;
};

const PREVIEW_EXPORT_DPI = 300;
const PREVIEW_EXPORT_CM_PER_INCH = 2.54;
let embeddedPosterFontCssPromise: Promise<string> | undefined;

function resolveExportSize(size: string): ExportSize {
  const normalized = size.toLowerCase().replace(/[×x]/g, "x").replace(/\s/g, "");
  if (normalized.includes("70x100")) return makeExportSize("70x100", "70x100cm", 70, 100);
  if (normalized.includes("50x70")) return makeExportSize("50x70", "50x70cm", 50, 70);
  return makeExportSize("30x40", "30x40cm", 30, 40);
}

function makeExportSize(key: string, label: string, widthCm: number, heightCm: number): ExportSize {
  return {
    key,
    label,
    widthPx: Math.round((widthCm / PREVIEW_EXPORT_CM_PER_INCH) * PREVIEW_EXPORT_DPI),
    heightPx: Math.round((heightCm / PREVIEW_EXPORT_CM_PER_INCH) * PREVIEW_EXPORT_DPI),
  };
}

async function renderPosterNodeToPng(node: HTMLElement, sizeValue: string) {
  const size = resolveExportSize(sizeValue);
  await document.fonts.ready;
  const embeddedFontCss = await getEmbeddedPosterFontCss();

  const poster = node.querySelector("[data-racepace-poster]") as HTMLElement | null;
  if (!poster) throw new Error("Poster preview was not found.");

  const previewBounds = poster.getBoundingClientRect();
  if (!previewBounds.width || !previewBounds.height) {
    throw new Error("Poster preview has invalid dimensions.");
  }
  const previewWidth = previewBounds.width;
  const previewHeight = previewBounds.height;

  const clone = poster.cloneNode(true) as HTMLElement;
  clone.style.width = `${previewWidth}px`;
  clone.style.height = `${previewHeight}px`;
  clone.style.maxWidth = "none";
  clone.style.aspectRatio = "auto";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";
  clone.style.boxSizing = "border-box";
  clone.querySelectorAll<HTMLElement | SVGElement>("*").forEach((element) => {
    element.style.boxSizing = "border-box";
  });
  clone.querySelectorAll("svg").forEach((svgNode) => {
    svgNode.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  });

  const html = `
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${previewWidth}px;height:${previewHeight}px;margin:0;padding:0;overflow:hidden;">
      <style>${embeddedFontCss}</style>
      ${clone.outerHTML}
    </div>
  `;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size.widthPx}" height="${size.heightPx}" viewBox="0 0 ${previewWidth} ${previewHeight}">
      <foreignObject width="${previewWidth}" height="${previewHeight}">${html}</foreignObject>
    </svg>
  `;

  // A blob: URL containing foreignObject taints the canvas in production Chrome.
  // Keeping the complete SVG in a data URL gives the image a safe, self-contained source.
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = size.widthPx;
  canvas.height = size.heightPx;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create image canvas.");
  context.drawImage(image, 0, 0, size.widthPx, size.heightPx);
  const png = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Could not render PNG."));
    }, "image/png");
  });
  return { blob: png, size };
}

function getEmbeddedPosterFontCss() {
  embeddedPosterFontCssPromise ??= (async () => {
    const stylesheetResponse = await fetch(POSTER_FONT_STYLESHEET_URL);
    if (!stylesheetResponse.ok) {
      throw new Error(`Could not load poster fonts (${stylesheetResponse.status}).`);
    }

    let stylesheet = await stylesheetResponse.text();
    const fontUrls = Array.from(
      new Set(stylesheet.match(/https:\/\/fonts\.gstatic\.com\/[^)'"\s]+/g) ?? []),
    );

    const embeddedFonts = await Promise.all(
      fontUrls.map(async (fontUrl) => {
        const fontResponse = await fetch(fontUrl);
        if (!fontResponse.ok) {
          throw new Error(`Could not load a poster font (${fontResponse.status}).`);
        }
        return [fontUrl, await blobToDataUrl(await fontResponse.blob())] as const;
      }),
    );

    for (const [fontUrl, dataUrl] of embeddedFonts) {
      stylesheet = stylesheet.split(fontUrl).join(dataUrl);
    }
    return stylesheet;
  })();

  return embeddedPosterFontCssPromise;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not embed poster font."));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load preview render."));
    image.src = src;
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function safeFilePart(value?: string) {
  return (
    (value || "racepace")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "racepace"
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

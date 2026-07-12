import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Receives Shopify `orders/create` webhook → inserts into `orders`.
// Configure in Shopify Admin → Settings → Notifications → Webhooks
// URL:     <site>/api/public/webhooks/shopify/orders-create
// Format:  JSON
// Secret:  SHOPIFY_WEBHOOK_SECRET

type ShopifyLineItemProperty = { name: string; value: string };
type ShopifyLineItem = {
  id?: number;
  title?: string;
  variant_title?: string;
  price?: string;
  properties?: ShopifyLineItemProperty[];
};
type ShopifyAddress = {
  first_name?: string;
  last_name?: string;
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  country?: string;
  country_code?: string;
  province?: string;
  province_code?: string;
  zip?: string;
  phone?: string;
};
type ShopifyOrder = {
  id: number;
  name?: string;
  order_number?: number;
  email?: string;
  total_price?: string;
  created_at?: string;
  customer?: { first_name?: string; last_name?: string; email?: string };
  shipping_address?: ShopifyAddress;
  line_items?: ShopifyLineItem[];
};

function prop(props: ShopifyLineItemProperty[] | undefined, ...names: string[]) {
  if (!props) return undefined;
  const lower = names.map((n) => n.toLowerCase());
  return props.find((p) => lower.includes((p.name || "").toLowerCase()))?.value;
}

function truthy(v: string | undefined) {
  return ["true", "1", "yes"].includes((v || "").toLowerCase().trim());
}

function shortRace(race: string) {
  return race
    .replace(/marathon|half|race|run/gi, "")
    .trim()
    .slice(0, 12)
    .toUpperCase() || race.slice(0, 6).toUpperCase();
}

const THEME_KEYS = ["midnight", "ember", "forest", "cream", "noir", "sky"];
function normalizeTheme(v: string | undefined) {
  const k = (v || "").toLowerCase().trim();
  return THEME_KEYS.includes(k) ? k : "midnight";
}

export const Route = createFileRoute("/api/public/webhooks/shopify/orders-create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
        if (!secret) return new Response("Server misconfigured", { status: 500 });

        const rawBody = await request.text();
        const headerHmac = request.headers.get("x-shopify-hmac-sha256") || "";
        const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

        const a = Buffer.from(headerHmac);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let order: ShopifyOrder;
        try {
          order = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const firstItem = order.line_items?.[0];
        const props = firstItem?.properties;

        const customerName =
          [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(" ") ||
          prop(props, "Name", "Runner") ||
          "Unknown runner";

        const race = prop(props, "Race", "Event") || firstItem?.title || "Unknown race";
        const time = prop(props, "Time", "Finish time") || "—";
        const raceDate = prop(props, "Date", "Race date") || (order.created_at || "").slice(0, 10);
        const yearMatch = raceDate.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
        const size = prop(props, "Size", "Poster size") || firstItem?.variant_title || "A3";
        const theme = normalizeTheme(prop(props, "_poster_theme", "Color", "Color theme", "Theme"));
        const location = [order.shipping_address?.city, order.shipping_address?.country]
          .filter(Boolean)
          .join(", ") || "—";
        const shippingName =
          order.shipping_address?.name ||
          [order.shipping_address?.first_name, order.shipping_address?.last_name]
            .filter(Boolean)
            .join(" ") ||
          customerName;
        const price = parseFloat(order.total_price || firstItem?.price || "0") || 0;
        const number = order.name || (order.order_number ? `#${order.order_number}` : `#${order.id}`);
        const raceId = prop(props, "_race_id");
        const routeVerified = truthy(prop(props, "_route_verified"));
        const source = prop(props, "_source");
        const designStatus = prop(props, "_design_status");
        const fulfillmentStatus = prop(props, "_fulfillment_status");
        const metaNotes = [
          raceId ? `Race ID: ${raceId}` : null,
          `Route verified: ${routeVerified ? "yes" : "no"}`,
          designStatus ? `Design status: ${designStatus}` : null,
          fulfillmentStatus ? `Fulfillment status: ${fulfillmentStatus}` : null,
          source ? `Source: ${source}` : null,
        ].filter(Boolean).join("\n");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { error } = await supabaseAdmin.from("orders").upsert({
          number,
          shopify_order_id: String(order.id),
          shopify_line_item_id: firstItem?.id ? String(firstItem.id) : null,
          customer_name: customerName,
          customer_email: order.customer?.email || order.email || "",
          customer_location: location,
          shipping_name: shippingName,
          shipping_address1: order.shipping_address?.address1 || null,
          shipping_address2: order.shipping_address?.address2 || null,
          shipping_city: order.shipping_address?.city || null,
          shipping_province: order.shipping_address?.province_code || order.shipping_address?.province || null,
          shipping_postal_code: order.shipping_address?.zip || null,
          shipping_country_code: order.shipping_address?.country_code || null,
          shipping_country: order.shipping_address?.country || null,
          shipping_phone: order.shipping_address?.phone || null,
          race,
          race_short: shortRace(race),
          race_id: raceId || null,
          route_verified: routeVerified,
          time,
          race_date: raceDate,
          year,
          size,
          theme_key: theme,
          status: "pending",
          price,
          notes: metaNotes || null,
          ordered_at: order.created_at || new Date().toISOString(),
        }, {
          onConflict: "number",
        });

        if (error) {
          console.error("shopify webhook insert failed", error);
          return new Response("Insert failed", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});

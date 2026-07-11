import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { themes, type Order, type OrderStatus } from "./mock-data";

type DbOrder = {
  id: string;
  number: string;
  customer_name: string;
  customer_email: string;
  customer_location: string | null;
  race: string;
  race_short: string;
  time: string;
  race_date: string;
  year: number;
  size: string;
  theme_key: string;
  status: OrderStatus;
  price: number | string;
  notes: string | null;
  ordered_at: string;
  shopify_order_id?: string | null;
  shopify_line_item_id?: string | null;
  race_id?: string | null;
  route_verified?: boolean | null;
  production_provider?: string | null;
  production_payload?: unknown;
  production_response?: unknown;
  production_sent_at?: string | null;
};

function toOrder(row: DbOrder): Order {
  const theme = themes[row.theme_key] ?? themes.midnight;
  return {
    id: row.id,
    number: row.number,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      location: row.customer_location ?? "",
    },
    race: row.race,
    raceShort: row.race_short,
    time: row.time,
    date: row.race_date,
    year: row.year,
    size: row.size,
    theme,
    status: row.status,
    orderedAt: row.ordered_at.slice(0, 10),
    price: Number(row.price),
    notes: row.notes ?? undefined,
    raceId: row.race_id ?? undefined,
    routeVerified: row.route_verified ?? undefined,
    productionProvider: row.production_provider ?? undefined,
    productionSentAt: row.production_sent_at ?? undefined,
  };
}

function buildPrintPayload(row: DbOrder) {
  return {
    order: {
      id: row.id,
      number: row.number,
      shopifyOrderId: row.shopify_order_id,
      shopifyLineItemId: row.shopify_line_item_id,
      orderedAt: row.ordered_at,
    },
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      location: row.customer_location,
    },
    poster: {
      race: row.race,
      raceShort: row.race_short,
      raceId: row.race_id,
      routeVerified: row.route_verified,
      date: row.race_date,
      year: row.year,
      time: row.time,
      size: row.size,
      themeKey: row.theme_key,
      price: Number(row.price),
    },
  };
}

export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("ordered_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as DbOrder[]).map(toOrder);
});

export const getAdminHealth = createServerFn({ method: "GET" }).handler(async () => ({
  supabaseUrl: Boolean(process.env.SUPABASE_URL),
  supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  sitePassword: Boolean(process.env.SITE_PASSWORD),
  sessionSecret: Boolean(process.env.SESSION_SECRET),
  shopifyWebhookSecret: Boolean(process.env.SHOPIFY_WEBHOOK_SECRET),
  printProviderEndpoint: Boolean(process.env.PRINT_PROVIDER_ENDPOINT),
  printProviderApiKey: Boolean(process.env.PRINT_PROVIDER_API_KEY),
  printProviderName: process.env.PRINT_PROVIDER_NAME || "Not configured",
}));

export const getOrderById = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return toOrder(row as DbOrder);
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        id: z.string(),
        status: z.enum(["pending", "in_review", "approved", "production", "completed"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendOrderToProduction = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const endpoint = process.env.PRINT_PROVIDER_ENDPOINT;
    if (!endpoint) {
      throw new Error(
        "Missing PRINT_PROVIDER_ENDPOINT. Add your print-provider/admin endpoint before sending orders.",
      );
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) throw new Error("Order not found.");

    const dbOrder = row as DbOrder;
    const payload = buildPrintPayload(dbOrder);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.PRINT_PROVIDER_API_KEY
          ? { Authorization: `Bearer ${process.env.PRINT_PROVIDER_API_KEY}` }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let providerResponse: unknown = text;
    try {
      providerResponse = text ? JSON.parse(text) : null;
    } catch {
      providerResponse = { raw: text };
    }

    if (!response.ok) {
      throw new Error(
        `Print provider rejected order (${response.status}): ${text || response.statusText}`,
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "production",
        production_provider: process.env.PRINT_PROVIDER_NAME || "custom",
        production_payload: payload,
        production_response: providerResponse,
        production_sent_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (updateError) throw new Error(updateError.message);
    return { ok: true, providerResponse };
  });

export const saveOrderNotes = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string(), notes: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ notes: data.notes })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

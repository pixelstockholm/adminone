import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { themes, type Order, type OrderStatus } from "./mock-data";
import { buildPrintExport, buildPrintPayloadWithExport } from "./print-export";

type DbOrder = {
  id: string;
  number: string;
  customer_name: string;
  customer_email: string;
  customer_location: string | null;
  shipping_name?: string | null;
  shipping_address1?: string | null;
  shipping_address2?: string | null;
  shipping_city?: string | null;
  shipping_province?: string | null;
  shipping_postal_code?: string | null;
  shipping_country_code?: string | null;
  shipping_country?: string | null;
  shipping_phone?: string | null;
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
    shopifyOrderId: row.shopify_order_id ?? undefined,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      location: row.customer_location ?? "",
    },
    shipping: getShippingAddress(row),
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

function isMissingColumnError(error: { message?: string; code?: string } | null | undefined) {
  return (
    error?.code === "42703" ||
    error?.message?.toLowerCase().includes("column") && error.message.toLowerCase().includes("does not exist")
  );
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
    shipping: getShippingAddress(row),
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
    production: buildPrintPayloadWithExport(row).printFile,
  };
}

function getShippingAddress(row: DbOrder) {
  return {
    name: row.shipping_name || row.customer_name,
    email: row.customer_email,
    phone: row.shipping_phone || undefined,
    address1: row.shipping_address1 || undefined,
    address2: row.shipping_address2 || undefined,
    city: row.shipping_city || undefined,
    province: row.shipping_province || undefined,
    postalCode: row.shipping_postal_code || undefined,
    countryCode: row.shipping_country_code || undefined,
    country: row.shipping_country || undefined,
  };
}

function requiredShippingAddress(row: DbOrder) {
  const shipping = getShippingAddress(row);
  const missing = [
    ["shipping_address1", shipping.address1],
    ["shipping_city", shipping.city],
    ["shipping_postal_code", shipping.postalCode],
    ["shipping_country_code", shipping.countryCode],
  ].filter(([, value]) => !value);

  if (missing.length) {
    throw new Error(
      `Missing shipping fields for print provider: ${missing.map(([key]) => key).join(", ")}.`,
    );
  }

  return shipping as typeof shipping & {
    address1: string;
    city: string;
    postalCode: string;
    countryCode: string;
  };
}

function getPublicPrintFileUrl(row: DbOrder) {
  const baseUrl = process.env.PRINT_FILE_BASE_URL || process.env.PUBLIC_ADMIN_BASE_URL;
  const token = process.env.PRINT_FILE_ACCESS_TOKEN;

  if (!baseUrl) {
    throw new Error("Missing PRINT_FILE_BASE_URL. Add your deployed adminone URL.");
  }
  if (!token) {
    throw new Error("Missing PRINT_FILE_ACCESS_TOKEN. Add a random token for secure print-file URLs.");
  }

  const base = baseUrl.replace(/\/$/, "");
  return `${base}/api/public/print-files/${row.id}?token=${encodeURIComponent(token)}`;
}

function resolveProdigiSku(size: string) {
  const normalized = size.toLowerCase().replace(/[×x]/g, "x").replace(/\s/g, "");
  const key = normalized.includes("70x100")
    ? "PRODIGI_SKU_70X100"
    : normalized.includes("50x70")
      ? "PRODIGI_SKU_50X70"
      : "PRODIGI_SKU_30X40";
  const sku = process.env[key];
  if (!sku) {
    throw new Error(`Missing ${key}. Choose the Prodigi Enhanced Matte Art Paper SKU for this size.`);
  }
  return sku;
}

function buildProdigiPayload(row: DbOrder) {
  const shipping = requiredShippingAddress(row);
  const printFileUrl = getPublicPrintFileUrl(row);

  return {
    shippingMethod: process.env.PRODIGI_SHIPPING_METHOD || "standard",
    merchantReference: row.number,
    recipient: {
      name: shipping.name,
      email: shipping.email,
      phoneNumber: shipping.phone,
      address: {
        line1: shipping.address1,
        line2: shipping.address2 || null,
        postalOrZipCode: shipping.postalCode,
        countryCode: shipping.countryCode,
        townOrCity: shipping.city,
        stateOrCounty: shipping.province || null,
      },
    },
    items: [
      {
        merchantReference: `${row.number}-${row.shopify_line_item_id || row.id}`,
        sku: resolveProdigiSku(row.size),
        copies: 1,
        sizing: "fillPrintArea",
        assets: [
          {
            printArea: "default",
            url: printFileUrl,
          },
        ],
        metadata: {
          race: row.race,
          raceId: row.race_id,
          finishTime: row.time,
          runnerName: row.customer_name,
          size: row.size,
        },
      },
    ],
    metadata: {
      racepaceOrderId: row.id,
      shopifyOrderId: row.shopify_order_id,
      routeVerified: row.route_verified,
    },
  };
}

function buildProductionRequest(row: DbOrder) {
  const provider = (process.env.PRINT_PROVIDER_NAME || "custom").toLowerCase();
  if (provider === "prodigi") {
    return {
      provider,
      payload: buildProdigiPayload(row),
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.PRINT_PROVIDER_API_KEY || "",
      },
    };
  }

  return {
    provider,
    payload: buildPrintPayload(row),
    headers: {
      "Content-Type": "application/json",
      ...(process.env.PRINT_PROVIDER_API_KEY
        ? { Authorization: `Bearer ${process.env.PRINT_PROVIDER_API_KEY}` }
        : {}),
    },
  };
}

export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let query = supabaseAdmin
    .from("orders")
    .select("*")
    .order("ordered_at", { ascending: false });

  if (process.env.SHOW_DEMO_ORDERS !== "true") {
    query = query.not("shopify_order_id", "is", null);
  }

  const { data, error } = await query;
  if (isMissingColumnError(error)) {
    console.warn("[Adminone] Orders table is missing Shopify/production columns. Run Supabase migrations.");
    return [];
  }
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
  printFileBaseUrl: Boolean(process.env.PRINT_FILE_BASE_URL || process.env.PUBLIC_ADMIN_BASE_URL),
  printFileAccessToken: Boolean(process.env.PRINT_FILE_ACCESS_TOKEN),
  prodigiSku30x40: Boolean(process.env.PRODIGI_SKU_30X40),
  prodigiSku50x70: Boolean(process.env.PRODIGI_SKU_50X70),
  prodigiSku70x100: Boolean(process.env.PRODIGI_SKU_70X100),
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

export const getOrderPrintExport = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Order not found.");
    return buildPrintExport(row as DbOrder);
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
    if (!dbOrder.shopify_order_id) {
      throw new Error("This is not a real Shopify order. Send a Shopify test order first.");
    }

    const productionRequest = buildProductionRequest(dbOrder);
    if (!(productionRequest.headers as Record<string, string>)["X-API-Key"] && productionRequest.provider === "prodigi") {
      throw new Error("Missing PRINT_PROVIDER_API_KEY. Add your Prodigi API key.");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: productionRequest.headers as Record<string, string>,
      body: JSON.stringify(productionRequest.payload),
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
        production_provider: productionRequest.provider,
        production_payload: productionRequest.payload,
        production_response: providerResponse as import("@/integrations/supabase/types").Json,
        production_sent_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (updateError) throw new Error(updateError.message);
    return { ok: true as const, providerResponse: JSON.stringify(providerResponse) };
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

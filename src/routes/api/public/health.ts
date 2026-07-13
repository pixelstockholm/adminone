import { createFileRoute } from "@tanstack/react-router";

function envReady(key: string) {
  return Boolean(process.env[key]);
}

function envLengthAtLeast(key: string, length: number) {
  return (process.env[key]?.length ?? 0) >= length;
}

const expectedOrderColumns = [
  "shopify_order_id",
  "shopify_line_item_id",
  "race_id",
  "route_verified",
  "production_provider",
  "production_payload",
  "production_response",
  "production_sent_at",
  "shipping_name",
  "shipping_address1",
  "shipping_address2",
  "shipping_city",
  "shipping_province",
  "shipping_postal_code",
  "shipping_country_code",
  "shipping_country",
  "shipping_phone",
];

async function getDatabaseHealth() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .select(expectedOrderColumns.join(","))
      .limit(1);

    if (!error) {
      return { ordersTable: true, productionColumns: true, error: null };
    }

    return {
      ordersTable: false,
      productionColumns: false,
      error: error.message,
    };
  } catch (error) {
    return {
      ordersTable: false,
      productionColumns: false,
      error: error instanceof Error ? error.message : "Unknown database health error",
    };
  }
}

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const database = await getDatabaseHealth();
        return Response.json({
          ok: true,
          supabaseUrl: envReady("SUPABASE_URL"),
          supabaseServiceRole: envReady("SUPABASE_SERVICE_ROLE_KEY"),
          database,
          sitePassword: envReady("SITE_PASSWORD"),
          sessionSecret: envReady("SESSION_SECRET"),
          sessionSecretStrong: envLengthAtLeast("SESSION_SECRET", 32),
          shopifyWebhookSecret: envReady("SHOPIFY_WEBHOOK_SECRET"),
          printProviderName: process.env.PRINT_PROVIDER_NAME || "Not configured",
          printProviderEndpoint: envReady("PRINT_PROVIDER_ENDPOINT"),
          printProviderApiKey: envReady("PRINT_PROVIDER_API_KEY"),
          printFileBaseUrl: envReady("PRINT_FILE_BASE_URL") || envReady("PUBLIC_ADMIN_BASE_URL"),
          printFileAccessToken: envReady("PRINT_FILE_ACCESS_TOKEN"),
          prodigiSku30x40: envReady("PRODIGI_SKU_30X40"),
          prodigiSku50x70: envReady("PRODIGI_SKU_50X70"),
          prodigiSku70x100: envReady("PRODIGI_SKU_70X100"),
        });
      },
    },
  },
});

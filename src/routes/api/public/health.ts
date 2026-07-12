import { createFileRoute } from "@tanstack/react-router";

function envReady(key: string) {
  return Boolean(process.env[key]);
}

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          supabaseUrl: envReady("SUPABASE_URL"),
          supabaseServiceRole: envReady("SUPABASE_SERVICE_ROLE_KEY"),
          sitePassword: envReady("SITE_PASSWORD"),
          sessionSecret: envReady("SESSION_SECRET"),
          shopifyWebhookSecret: envReady("SHOPIFY_WEBHOOK_SECRET"),
          printProviderName: process.env.PRINT_PROVIDER_NAME || "Not configured",
          printProviderEndpoint: envReady("PRINT_PROVIDER_ENDPOINT"),
          printProviderApiKey: envReady("PRINT_PROVIDER_API_KEY"),
          printFileBaseUrl: envReady("PRINT_FILE_BASE_URL") || envReady("PUBLIC_ADMIN_BASE_URL"),
          printFileAccessToken: envReady("PRINT_FILE_ACCESS_TOKEN"),
          prodigiSku30x40: envReady("PRODIGI_SKU_30X40"),
          prodigiSku50x70: envReady("PRODIGI_SKU_50X70"),
          prodigiSku70x100: envReady("PRODIGI_SKU_70X100"),
        }),
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getAdminHealth } from "@/lib/orders.functions";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Racepace Admin" }] }),
  component: SettingsPage,
  errorComponent: ({ error }) => (
    <div className="px-8 py-7 max-w-[900px] mx-auto">
      <PageHeader title="Settings" description="Integration health could not load." />
      <div className="surface-card mt-6 p-5">
        <div className="font-serif text-2xl">Settings check failed.</div>
        <p className="mt-2 text-sm text-muted-foreground leading-6">
          {error.message ||
            "Adminone could not read its environment health. Check deployment envs and redeploy."}
        </p>
      </div>
    </div>
  ),
});

function SettingsPage() {
  const {
    data: health,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-health"],
    queryFn: () => getAdminHealth(),
    retry: false,
  });

  const safeHealth = health ?? {
    supabaseUrl: false,
    supabaseServiceRole: false,
    sitePassword: false,
    sessionSecret: false,
    shopifyWebhookSecret: false,
    printProviderEndpoint: false,
    printProviderApiKey: false,
    printProviderName: "Loading",
    printFileBaseUrl: false,
    printFileAccessToken: false,
    prodigiSku30x40: false,
    prodigiSku50x70: false,
    prodigiSku70x100: false,
  };

  return (
    <div className="px-8 py-7 max-w-[900px] mx-auto">
      <PageHeader
        title="Settings"
        description="Manage workspace, integrations, and production options."
      />

      {isLoading && (
        <div className="surface-card mt-6 p-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking deployment environment...
        </div>
      )}

      {error && (
        <div className="surface-card mt-6 p-5 border-[oklch(0.78_0.15_75)]/25 bg-[oklch(0.78_0.15_75)]/10">
          <div className="font-medium">Environment health failed</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Could not load admin health."}
          </p>
        </div>
      )}

      <div className="space-y-5 mt-6">
        <Section title="Workspace">
          <Field label="Workspace name" value="Racepace" />
          <Field label="Contact email" value="hello@racepace.shop" />
          <StatusField label="Access code" ready={safeHealth.sitePassword} envKey="SITE_PASSWORD" />
          <StatusField
            label="Session encryption"
            ready={safeHealth.sessionSecret}
            envKey="SESSION_SECRET"
          />
        </Section>

        <Section title="Shopify Integration">
          <Field label="Store" value="pathorize-flow-iaw9w.myshopify.com" />
          <Field label="Webhook topic" value="orders/create" />
          <Field
            label="Webhook URL"
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/public/webhooks/shopify/orders-create`}
          />
          <StatusField
            label="Signing secret"
            ready={safeHealth.shopifyWebhookSecret}
            envKey="SHOPIFY_WEBHOOK_SECRET"
          />
          <StatusField label="Supabase URL" ready={safeHealth.supabaseUrl} envKey="SUPABASE_URL" />
          <StatusField
            label="Supabase service role"
            ready={safeHealth.supabaseServiceRole}
            envKey="SUPABASE_SERVICE_ROLE_KEY"
          />
        </Section>

        <Section title="Production">
          <Toggle label="Auto-approve generated previews" enabled={false} />
          <Toggle label="Send to print provider on approval" enabled={false} />
          <Toggle label="Notify customer on production start" enabled={false} />
        </Section>

        <Section title="Print Provider">
          <Field label="Provider" value={safeHealth.printProviderName} />
          <StatusField
            label="Production endpoint"
            ready={safeHealth.printProviderEndpoint}
            envKey="PRINT_PROVIDER_ENDPOINT"
          />
          <StatusField
            label="Provider API key"
            ready={safeHealth.printProviderApiKey}
            envKey="PRINT_PROVIDER_API_KEY"
          />
          <StatusField
            label="Public print-file URL"
            ready={safeHealth.printFileBaseUrl}
            envKey="PRINT_FILE_BASE_URL"
          />
          <StatusField
            label="Print-file access token"
            ready={safeHealth.printFileAccessToken}
            envKey="PRINT_FILE_ACCESS_TOKEN"
          />
          <StatusField
            label="Prodigi 30x40 SKU"
            ready={safeHealth.prodigiSku30x40}
            envKey="PRODIGI_SKU_30X40"
          />
          <StatusField
            label="Prodigi 50x70 SKU"
            ready={safeHealth.prodigiSku50x70}
            envKey="PRODIGI_SKU_50X70"
          />
          <StatusField
            label="Prodigi 70x100 SKU"
            ready={safeHealth.prodigiSku70x100}
            envKey="PRODIGI_SKU_70X100"
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border text-xs uppercase tracking-widest text-muted-foreground font-medium">
        {title}
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}

function Field({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="text-sm text-muted-foreground">{label}</div>
      {badge ? (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[oklch(0.72_0.16_155)]/20 bg-[oklch(0.72_0.16_155)]/10 text-[oklch(0.82_0.13_155)] text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.16_155)]" /> {value}
        </span>
      ) : (
        <div className="text-sm">{value}</div>
      )}
    </div>
  );
}

function StatusField({ label, ready, envKey }: { label: string; ready?: boolean; envKey: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 gap-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${
          ready
            ? "border-[oklch(0.72_0.16_155)]/20 bg-[oklch(0.72_0.16_155)]/10 text-[oklch(0.82_0.13_155)]"
            : "border-[oklch(0.78_0.15_75)]/20 bg-[oklch(0.78_0.15_75)]/10 text-[oklch(0.85_0.12_75)]"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            ready ? "bg-[oklch(0.72_0.16_155)]" : "bg-[oklch(0.78_0.15_75)]"
          }`}
        />
        {ready ? "Configured" : envKey}
      </span>
    </div>
  );
}

function Toggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="text-sm">{label}</div>
      <div
        className={`relative h-5 w-9 rounded-full transition ${enabled ? "bg-primary" : "bg-muted"}`}
      >
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition ${enabled ? "left-[18px]" : "left-0.5"}`}
        />
      </div>
    </div>
  );
}

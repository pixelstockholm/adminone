import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Racepace Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="px-8 py-7 max-w-[900px] mx-auto">
      <PageHeader title="Settings" description="Manage workspace, integrations, and production options." />

      <div className="space-y-5 mt-6">
        <Section title="Workspace">
          <Field label="Workspace name" value="Racepace" />
          <Field label="Contact email" value="orders@racepace.com" />
        </Section>

        <Section title="Shopify Integration">
          <Field label="Store" value="pathorize-flow-iaw9w.myshopify.com" />
          <Field label="Webhook topic" value="orders/create" />
          <Field
            label="Webhook URL"
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/public/webhooks/shopify/orders-create`}
          />
          <Field label="Signing secret" value="SHOPIFY_WEBHOOK_SECRET (saved)" badge />
        </Section>

        <Section title="Production">
          <Toggle label="Auto-approve generated previews" enabled={false} />
          <Toggle label="Send to print provider on approval" enabled />
          <Toggle label="Notify customer on production start" enabled />
        </Section>

        <Section title="Print Provider">
          <Field label="Provider" value="Prodigi" />
          <Field label="Default paper" value="Matte 250gsm" />
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

function Toggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="text-sm">{label}</div>
      <div className={`relative h-5 w-9 rounded-full transition ${enabled ? "bg-primary" : "bg-muted"}`}>
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition ${enabled ? "left-[18px]" : "left-0.5"}`} />
      </div>
    </div>
  );
}

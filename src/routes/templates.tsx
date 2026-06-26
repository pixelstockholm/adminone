import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { templates } from "@/lib/mock-data";
import { PosterPreview } from "@/components/poster-preview";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "Templates · Pathorize Admin" }] }),
  component: TemplatesPage,
});

function TemplatesPage() {
  return (
    <div className="px-8 py-7 max-w-[1400px] mx-auto">
      <PageHeader
        title="Templates"
        description="Poster designs available in the Shopify customizer."
        actions={
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background hover:opacity-90 text-xs font-medium transition">
            <Plus className="h-3.5 w-3.5" /> New template
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {templates.map((t) => (
          <div key={t.id} className="surface-card overflow-hidden hover:border-border-strong transition group">
            <div className="p-5 bg-gradient-to-br from-surface to-card">
              <div className="max-w-[200px] mx-auto shadow-xl shadow-black/30 rounded-md">
                <PosterPreview
                  theme={t.theme}
                  title="MARATHON"
                  subtitle="2025"
                  time="3:24:18"
                  date="OCT 12, 2025"
                  name="YOUR NAME"
                  size="md"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.category}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium tabular-nums">{t.uses}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">orders</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

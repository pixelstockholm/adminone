import { createFileRoute } from "@tanstack/react-router";
import { renderPrintPdf } from "@/lib/print-export";

export const Route = createFileRoute("/api/public/print-files/$orderId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const token = process.env.PRINT_FILE_ACCESS_TOKEN;
        if (!token) return new Response("Server misconfigured", { status: 500 });

        const url = new URL(request.url);
        if (url.searchParams.get("token") !== token) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row, error } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("id", params.orderId)
          .maybeSingle();

        if (error) return new Response(error.message, { status: 500 });
        if (!row) return new Response("Order not found", { status: 404 });

        const file = await renderPrintPdf(row);
        return new Response(file.pdf, {
          status: 200,
          headers: {
            "Content-Type": file.mimeType,
            "Content-Disposition": `inline; filename="${file.fileName}"`,
            "Cache-Control": "private, max-age=300",
          },
        });
      },
    },
  },
});

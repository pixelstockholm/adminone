import { createFileRoute } from "@tanstack/react-router";

const PRINT_FILES_BUCKET = "print-files";
const PRINT_FILE_NAME = "preview-300dpi.png";

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

        const path = `${row.id}/${PRINT_FILE_NAME}`;
        const { data: file, error: fileError } = await supabaseAdmin.storage
          .from(PRINT_FILES_BUCKET)
          .download(path);
        if (fileError || !file) {
          return new Response("Production PNG not found", { status: 404 });
        }

        return new Response(file, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Content-Length": String(file.size),
            "Content-Disposition": `inline; filename="racepace-${row.id}.png"`,
            "Cache-Control": "private, max-age=300",
          },
        });
      },
    },
  },
});

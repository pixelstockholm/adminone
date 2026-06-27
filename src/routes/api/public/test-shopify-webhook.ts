import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "crypto";

// TEMP test endpoint — sends a signed fake Shopify order to the real webhook.
export const Route = createFileRoute("/api/public/test-shopify-webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
        if (!secret) return new Response("no secret", { status: 500 });

        const payload = {
          id: Date.now(),
          name: `#TEST-${Math.floor(Math.random() * 9000 + 1000)}`,
          email: "test.runner@example.com",
          total_price: "89.00",
          created_at: new Date().toISOString(),
          customer: { first_name: "Test", last_name: "Runner", email: "test.runner@example.com" },
          shipping_address: { city: "Stockholm", country: "Sweden" },
          line_items: [
            {
              title: "Custom Marathon Poster",
              variant_title: "A2",
              price: "89.00",
              properties: [
                { name: "Name", value: "Test Runner" },
                { name: "Race", value: "Stockholm Marathon" },
                { name: "Time", value: "3:42:18" },
                { name: "Date", value: "2026-06-01" },
                { name: "Size", value: "A2" },
                { name: "Color", value: "ember" },
              ],
            },
          ],
        };
        const body = JSON.stringify(payload);
        const hmac = createHmac("sha256", secret).update(body, "utf8").digest("base64");

        const origin = new URL(request.url).origin;
        const res = await fetch(`${origin}/api/public/webhooks/shopify/orders-create`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-shopify-hmac-sha256": hmac,
          },
          body,
        });
        const text = await res.text();
        return Response.json({ status: res.status, body: text, sent: payload.name });
      },
    },
  },
});

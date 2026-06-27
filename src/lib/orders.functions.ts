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
    z.object({
      id: z.string(),
      status: z.enum(["pending", "in_review", "approved", "production", "completed"]),
    }).parse(input),
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

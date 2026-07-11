ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shopify_order_id TEXT,
  ADD COLUMN IF NOT EXISTS shopify_line_item_id TEXT,
  ADD COLUMN IF NOT EXISTS race_id TEXT,
  ADD COLUMN IF NOT EXISTS route_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS production_provider TEXT,
  ADD COLUMN IF NOT EXISTS production_payload JSONB,
  ADD COLUMN IF NOT EXISTS production_response JSONB,
  ADD COLUMN IF NOT EXISTS production_sent_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS orders_number_key ON public.orders(number);
CREATE INDEX IF NOT EXISTS orders_shopify_order_id_idx ON public.orders(shopify_order_id);
CREATE INDEX IF NOT EXISTS orders_race_id_idx ON public.orders(race_id);
CREATE INDEX IF NOT EXISTS orders_production_sent_at_idx ON public.orders(production_sent_at DESC);
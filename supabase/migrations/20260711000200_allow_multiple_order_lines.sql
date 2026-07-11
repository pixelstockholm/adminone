ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS orders_shopify_line_unique_idx
  ON public.orders(shopify_order_id, shopify_line_item_id)
  WHERE shopify_order_id IS NOT NULL AND shopify_line_item_id IS NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_name TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address1 TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address2 TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city TEXT,
  ADD COLUMN IF NOT EXISTS shipping_province TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS shipping_country_code TEXT,
  ADD COLUMN IF NOT EXISTS shipping_country TEXT,
  ADD COLUMN IF NOT EXISTS shipping_phone TEXT;

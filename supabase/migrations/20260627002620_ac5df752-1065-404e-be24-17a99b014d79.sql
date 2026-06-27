
-- Enums
CREATE TYPE public.order_status AS ENUM ('pending','in_review','approved','production','completed');

-- Templates
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  theme_key TEXT NOT NULL,
  uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
-- No policies yet — only service_role (server functions) can access until auth is added.

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_location TEXT,
  race TEXT NOT NULL,
  race_short TEXT NOT NULL,
  time TEXT NOT NULL,
  race_date TEXT NOT NULL,
  year INTEGER NOT NULL,
  size TEXT NOT NULL,
  theme_key TEXT NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  price NUMERIC(10,2) NOT NULL,
  notes TEXT,
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order notes
CREATE TABLE public.order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_notes TO authenticated;
GRANT ALL ON public.order_notes TO service_role;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_ordered_at_idx ON public.orders(ordered_at DESC);
CREATE INDEX order_notes_order_id_idx ON public.order_notes(order_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed templates
INSERT INTO public.templates (name, category, theme_key, uses) VALUES
('Classic Stripe','Marathon','midnight',412),
('Minimal Type','Marathon','cream',318),
('Heritage','Marathon','noir',264),
('Bold Modern','Half Marathon','ember',197),
('Forest Trail','Trail','forest',142),
('Sky Line','10K','sky',98);

-- Seed orders (24 rows mirroring the mock data)
INSERT INTO public.orders (number, customer_name, customer_email, customer_location, race, race_short, time, race_date, year, size, theme_key, status, price, notes, ordered_at) VALUES
('#PZ-4820','Marcus Chen','m.chen@email.com','San Francisco, US','Berlin Marathon','BERLIN','3:12:47','Jan 1, 2024','2024','A3','forest','pending',49,'Customer requested matte finish.','2026-06-01'),
('#PZ-4821','Sofia Bergström','sofia.b@email.com','Stockholm, SE','New York City Marathon','NEW YORK','3:28:11','Feb 8, 2025','2025','18×24','cream','in_review',64,NULL,'2026-06-06'),
('#PZ-4822','James O''Connor','j.oconnor@email.com','Dublin, IE','London Marathon','LONDON','3:45:02','Mar 15, 2024','2024','24×36','noir','approved',79,NULL,'2026-06-11'),
('#PZ-4823','Yuki Tanaka','yuki.t@email.com','Tokyo, JP','Boston Marathon','BOSTON','4:01:33','Apr 22, 2025','2025','A2','sky','production',94,'Customer requested matte finish.','2026-06-16'),
('#PZ-4824','Aiko Müller','aiko.m@email.com','Berlin, DE','Chicago Marathon','CHICAGO','4:18:29','May 1, 2024','2024','A3','midnight','completed',49,NULL,'2026-06-21'),
('#PZ-4825','Daniel Park','d.park@email.com','Seoul, KR','Tokyo Marathon','TOKYO','4:32:55','Sep 8, 2025','2025','18×24','ember','pending',64,NULL,'2026-06-01'),
('#PZ-4826','Charlotte Dubois','c.dubois@email.com','Paris, FR','Paris Marathon','PARIS','2:41:08','Oct 15, 2024','2024','24×36','forest','in_review',79,'Customer requested matte finish.','2026-06-06'),
('#PZ-4827','Liam Hartley','liam.h@email.com','London, UK','Valencia Marathon','VALENCIA','3:06:22','Nov 22, 2025','2025','A2','cream','approved',94,NULL,'2026-06-11'),
('#PZ-4828','Maria Alvarez','m.alvarez@email.com','Madrid, ES','Amsterdam Marathon','AMSTERDAM','2:54:18','Jan 1, 2024','2024','A3','noir','production',49,NULL,'2026-06-16'),
('#PZ-4829','Noah Schmidt','noah.s@email.com','Zurich, CH','Copenhagen Half','COPENHAGEN','3:12:47','Feb 8, 2025','2025','18×24','sky','completed',64,'Customer requested matte finish.','2026-06-21'),
('#PZ-4830','Hannah Lindqvist','hannah.l@email.com','Oslo, NO','Berlin Marathon','BERLIN','3:28:11','Mar 15, 2024','2024','24×36','midnight','pending',79,NULL,'2026-06-01'),
('#PZ-4831','Elena Rossi','elena.rossi@email.com','Milan, IT','New York City Marathon','NEW YORK','3:45:02','Apr 22, 2025','2025','A2','ember','in_review',94,'Customer requested matte finish.','2026-06-06'),
('#PZ-4832','Marcus Chen','m.chen@email.com','San Francisco, US','London Marathon','LONDON','4:01:33','May 1, 2024','2024','A3','forest','approved',49,NULL,'2026-06-11'),
('#PZ-4833','Sofia Bergström','sofia.b@email.com','Stockholm, SE','Boston Marathon','BOSTON','4:18:29','Sep 8, 2025','2025','18×24','cream','production',64,NULL,'2026-06-16'),
('#PZ-4834','James O''Connor','j.oconnor@email.com','Dublin, IE','Chicago Marathon','CHICAGO','4:32:55','Oct 15, 2024','2024','24×36','noir','completed',79,NULL,'2026-06-21'),
('#PZ-4835','Yuki Tanaka','yuki.t@email.com','Tokyo, JP','Tokyo Marathon','TOKYO','2:41:08','Nov 22, 2025','2025','A2','sky','pending',94,'Customer requested matte finish.','2026-06-01'),
('#PZ-4836','Aiko Müller','aiko.m@email.com','Berlin, DE','Paris Marathon','PARIS','2:54:18','Jan 1, 2024','2024','A3','midnight','in_review',49,NULL,'2026-06-06'),
('#PZ-4837','Daniel Park','d.park@email.com','Seoul, KR','Valencia Marathon','VALENCIA','3:12:47','Feb 8, 2025','2025','18×24','ember','approved',64,NULL,'2026-06-11'),
('#PZ-4838','Charlotte Dubois','c.dubois@email.com','Paris, FR','Amsterdam Marathon','AMSTERDAM','3:28:11','Mar 15, 2024','2024','24×36','forest','production',79,'Customer requested matte finish.','2026-06-16'),
('#PZ-4839','Liam Hartley','liam.h@email.com','London, UK','Copenhagen Half','COPENHAGEN','3:45:02','Apr 22, 2025','2025','A2','cream','completed',94,NULL,'2026-06-21'),
('#PZ-4840','Maria Alvarez','m.alvarez@email.com','Madrid, ES','Berlin Marathon','BERLIN','4:01:33','May 1, 2024','2024','A3','noir','pending',49,NULL,'2026-06-01'),
('#PZ-4841','Noah Schmidt','noah.s@email.com','Zurich, CH','New York City Marathon','NEW YORK','4:18:29','Sep 8, 2025','2025','18×24','sky','in_review',64,'Customer requested matte finish.','2026-06-06'),
('#PZ-4842','Hannah Lindqvist','hannah.l@email.com','Oslo, NO','London Marathon','LONDON','4:32:55','Oct 15, 2024','2024','24×36','midnight','approved',79,NULL,'2026-06-11'),
('#PZ-4843','Elena Rossi','elena.rossi@email.com','Milan, IT','Boston Marathon','BOSTON','2:41:08','Nov 22, 2025','2025','A2','ember','production',94,NULL,'2026-06-16');

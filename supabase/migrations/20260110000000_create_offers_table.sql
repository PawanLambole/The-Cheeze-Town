-- Create offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  min_bill_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  target_item_id BIGINT REFERENCES public.menu_items(id) ON DELETE CASCADE,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT offers_type_check CHECK (type IN ('percentage_bill', 'percentage_item', 'menu_item_fixed', 'menu_item_percentage'))
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all access for authenticated users" ON public.offers
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for everyone" ON public.offers
  FOR SELECT USING (true);

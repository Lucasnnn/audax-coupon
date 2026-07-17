CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL,
  discount_value INTEGER NOT NULL,
  status TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  min_order_amount INTEGER,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL,
  discount_value INTEGER NOT NULL,
  status TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  min_order_amount INTEGER,
  expires_at TIMESTAMPTZ,
  CONSTRAINT coupons_discount_type_check
    CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
  CONSTRAINT coupons_status_check
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  CONSTRAINT coupons_usage_count_check
    CHECK (usage_count >= 0),
  CONSTRAINT coupons_discount_value_check
    CHECK (discount_value > 0),
  CONSTRAINT coupons_percentage_range_check
    CHECK (
      discount_type <> 'PERCENTAGE'
      OR (discount_value >= 1 AND discount_value <= 100)
    ),
  CONSTRAINT coupons_fixed_min_order_check
    CHECK (
      discount_type <> 'FIXED'
      OR (
        min_order_amount IS NOT NULL
        AND min_order_amount >= discount_value
      )
    )
);

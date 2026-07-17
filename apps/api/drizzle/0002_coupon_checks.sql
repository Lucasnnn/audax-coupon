-- Apply domain CHECKs on existing volumes where CREATE TABLE IF NOT EXISTS
-- already created the table without constraints.
DO $$
BEGIN
  ALTER TABLE coupons
    ADD CONSTRAINT coupons_discount_type_check
    CHECK (discount_type IN ('PERCENTAGE', 'FIXED'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE coupons
    ADD CONSTRAINT coupons_status_check
    CHECK (status IN ('ACTIVE', 'INACTIVE'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE coupons
    ADD CONSTRAINT coupons_usage_count_check
    CHECK (usage_count >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE coupons
    ADD CONSTRAINT coupons_discount_value_check
    CHECK (discount_value > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE coupons
    ADD CONSTRAINT coupons_percentage_range_check
    CHECK (
      discount_type <> 'PERCENTAGE'
      OR (discount_value >= 1 AND discount_value <= 100)
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE coupons
    ADD CONSTRAINT coupons_fixed_min_order_check
    CHECK (
      discount_type <> 'FIXED'
      OR (
        min_order_amount IS NOT NULL
        AND min_order_amount >= discount_value
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

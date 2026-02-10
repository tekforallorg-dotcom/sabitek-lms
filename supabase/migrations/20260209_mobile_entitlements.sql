-- Migration: Create mobile entitlements and operations tables
-- Run: supabase migration new mobile_entitlements
-- Then paste this content into the generated file

-- Mobile entitlements (pay-per-action receipts)
CREATE TABLE IF NOT EXISTS mobile_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('google_play', 'apple_iap', 'paystack')),
  transaction_id TEXT UNIQUE,
  tool_type TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  price_kobo INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'consumed', 'expired', 'refunded')),
  expires_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for entitlement lookups
CREATE INDEX idx_mobile_entitlements_device ON mobile_entitlements (device_id, status);
CREATE INDEX idx_mobile_entitlements_transaction ON mobile_entitlements (transaction_id);
CREATE INDEX idx_mobile_entitlements_status ON mobile_entitlements (status, expires_at);

-- Mobile operations (processing history, no user_id)
CREATE TABLE IF NOT EXISTS mobile_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  entitlement_id UUID REFERENCES mobile_entitlements(id),
  tool_type TEXT NOT NULL,
  action TEXT,
  input_text TEXT,
  input_chars INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  output_text TEXT,
  output_tokens INTEGER DEFAULT 0,
  model_provider TEXT,
  model_name TEXT,
  route_reason TEXT,
  cost_kobo INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for operation lookups
CREATE INDEX idx_mobile_operations_device ON mobile_operations (device_id);
CREATE INDEX idx_mobile_operations_entitlement ON mobile_operations (entitlement_id);
CREATE INDEX idx_mobile_operations_status ON mobile_operations (status);

-- Auto-expire entitlements (run via pg_cron or app logic)
-- UPDATE mobile_entitlements
-- SET status = 'expired'
-- WHERE status = 'paid' AND expires_at < NOW();

-- RLS policies (service role only — no direct client access)
ALTER TABLE mobile_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_operations ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "service_role_entitlements" ON mobile_entitlements
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_operations" ON mobile_operations
  FOR ALL USING (auth.role() = 'service_role');
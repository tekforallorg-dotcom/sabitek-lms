-- Migration: Mobile wallets (device-based, no auth required)
-- Allows users to pre-fund a wallet and pay for operations instantly

CREATE TABLE IF NOT EXISTS mobile_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  balance_kobo INTEGER NOT NULL DEFAULT 0,
  total_credited_kobo INTEGER NOT NULL DEFAULT 0,
  total_debited_kobo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mobile_wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES mobile_wallets(id),
  device_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'refund')),
  amount_kobo INTEGER NOT NULL,
  balance_before_kobo INTEGER NOT NULL,
  balance_after_kobo INTEGER NOT NULL,
  reference_type TEXT, -- 'topup', 'operation', 'refund'
  reference_id TEXT,   -- paystack ref or operation id
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mobile_wallets_device ON mobile_wallets (device_id);
CREATE INDEX idx_mobile_wallet_ledger_device ON mobile_wallet_ledger (device_id);
CREATE INDEX idx_mobile_wallet_ledger_wallet ON mobile_wallet_ledger (wallet_id);

-- RLS (service role only)
ALTER TABLE mobile_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_mobile_wallets" ON mobile_wallets
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_mobile_wallet_ledger" ON mobile_wallet_ledger
  FOR ALL USING (auth.role() = 'service_role');
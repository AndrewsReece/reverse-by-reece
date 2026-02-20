-- ══════════════════════════════════════════════════════════
-- Reverse by Reece — Supabase Database Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ══════════════════════════════════════════════════════════

-- 1. CUSTOMERS (leads)
CREATE TABLE IF NOT EXISTS customers (
  id BIGINT PRIMARY KEY,
  cust_id TEXT UNIQUE NOT NULL,
  lead_id TEXT,
  name TEXT NOT NULL,
  state TEXT DEFAULT 'AZ',
  address TEXT,
  dob TEXT,
  phone TEXT,
  email TEXT,
  source TEXT,
  notes TEXT,
  orig_mortgage_date TEXT,
  max_claim TEXT,
  mip_amount NUMERIC DEFAULT 0,
  interest_rate TEXT,
  converted BOOLEAN DEFAULT FALSE,
  converted_at TEXT,
  created_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEALS (pipeline)
CREATE TABLE IF NOT EXISTS deals (
  id BIGINT PRIMARY KEY,
  lead_id TEXT,
  name TEXT NOT NULL,
  state TEXT,
  dob TEXT,
  email TEXT,
  property_value NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  current_pl NUMERIC DEFAULT 0,
  new_pl NUMERIC DEFAULT 0,
  new_mca NUMERIC DEFAULT 0,
  total_refi_costs NUMERIC DEFAULT 0,
  net_available NUMERIC DEFAULT 0,
  broker_income NUMERIC DEFAULT 0,
  lender TEXT,
  product_label TEXT,
  margin NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pitched',
  created_at TEXT,
  passes_3x1 BOOLEAN DEFAULT FALSE,
  passes_5x1 BOOLEAN DEFAULT FALSE,
  passes_proceeds BOOLEAN DEFAULT FALSE,
  passes_seasoning BOOLEAN DEFAULT FALSE,
  ratio_3x1 TEXT,
  rate_type TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT,
  notes TEXT,
  cost_per_piece TEXT,
  hours_estimate TEXT,
  lead_ids JSONB DEFAULT '[]'::JSONB,
  created_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MAILINGS (mail pieces per customer per campaign)
CREATE TABLE IF NOT EXISTS mailings (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
  campaign_id BIGINT,
  stamp_type TEXT,
  envelope_type TEXT,
  date_sent TEXT,
  notes TEXT,
  cost TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  due_date TEXT,
  deal_id TEXT,
  lead_id TEXT,
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  done BOOLEAN DEFAULT FALSE,
  completed_at TEXT,
  created_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGINT PRIMARY KEY,
  deal_id BIGINT,
  text TEXT NOT NULL,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REFERRAL PARTNERS
CREATE TABLE IF NOT EXISTS referrals (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Financial Advisor',
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT PRIMARY KEY,
  description TEXT NOT NULL,
  amount TEXT,
  category TEXT DEFAULT 'Marketing',
  date TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DOC CHECKLIST STATE
CREATE TABLE IF NOT EXISTS doc_checks (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT NOT NULL,
  doc_name TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  UNIQUE(deal_id, doc_name)
);

-- 10. LICENSING CHECKLIST STATE
CREATE TABLE IF NOT EXISTS lic_checks (
  id BIGSERIAL PRIMARY KEY,
  check_key TEXT UNIQUE NOT NULL,
  checked BOOLEAN DEFAULT FALSE
);

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- For a single-user app, we enable RLS but allow all
-- operations with the anon key. For multi-user, you'd
-- add user_id columns and policies per user.
-- ══════════════════════════════════════════════════════════

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lic_checks ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon role (single-user app)
CREATE POLICY "Allow all" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON mailings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON referrals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON doc_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON lic_checks FOR ALL USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════
-- INDEXES for fast search
-- ══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_customers_cust_id ON customers(cust_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_address ON customers(address);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_tasks_done ON tasks(done);
CREATE INDEX IF NOT EXISTS idx_mailings_customer ON mailings(customer_id);

-- Done! Your database is ready.
-- Now deploy the app and start adding data.

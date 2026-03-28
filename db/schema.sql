-- ════════════════════════════════════════════════════════
-- Split It Fair — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ════════════════════════════════════════════════════════

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  base_currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  paid_by INTEGER NOT NULL REFERENCES members(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  split_method VARCHAR(20) NOT NULL DEFAULT 'equal',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_interval VARCHAR(20),
  last_recurrence_date DATE,
  category VARCHAR(50) DEFAULT 'Others',
  exchange_rate DECIMAL(12, 6) DEFAULT 1.0,
  converted_amount DECIMAL(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_split_method CHECK (split_method IN ('equal', 'percentage', 'share', 'item'))
);

-- Expense splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id),
  amount DECIMAL(12, 2) NOT NULL,
  item_description VARCHAR(255),
  percentage_or_shares DECIMAL(10, 4)
);

-- ════════════════════════════════════════════════════════
-- Row Level Security (RLS) — disable for now (API handles auth)
-- ════════════════════════════════════════════════════════
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth for hackathon)
CREATE POLICY "Allow all on groups" ON groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expense_splits" ON expense_splits FOR ALL USING (true) WITH CHECK (true);

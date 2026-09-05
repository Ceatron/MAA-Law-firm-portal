-- ==============================================================================
-- MUTHONI AHAGO ADVOCATES (MAA LAW FIRM PORTAL)
-- DATABASE SYNC ENHANCEMENT & TIME ENTRIES SCHEMA
-- Migration: 20260905000001_time_entries_and_sync_enhancements.sql
-- ==============================================================================

-- 1. CREATE TIME_ENTRIES TABLE (Billable / Non-Billable Advocate Time Tracking)
CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    matter_id TEXT REFERENCES matters(id) ON DELETE SET NULL,
    matter_ref TEXT,
    advocate_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    billable BOOLEAN NOT NULL DEFAULT TRUE,
    hourly_rate_kes NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_fee_kes NUMERIC(15,2) NOT NULL DEFAULT 0,
    billed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying of time entries
CREATE INDEX IF NOT EXISTS idx_time_entries_matter_id ON time_entries(matter_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_advocate ON time_entries(advocate_name);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);

-- Enable RLS on time_entries
ALTER TABLE IF EXISTS time_entries ENABLE ROW LEVEL SECURITY;

-- Policies for time_entries
CREATE POLICY "Staff can view time entries"
    ON time_entries FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff can manage time entries"
    ON time_entries FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. ENSURE ALL TABLES ARE ADDED TO SUPABASE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS matters;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS clients;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS deadlines;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS activities;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS fee_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS payments;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS quotations;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS document_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS documents;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS document_drafts;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS client_onboardings;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS leave_balances;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS time_entries;

-- 3. ENSURE AUDIT TRIGGERS AND TIMESTAMP AUTO-UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_time_entries_updated_at ON time_entries;
CREATE TRIGGER trg_time_entries_updated_at
    BEFORE UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

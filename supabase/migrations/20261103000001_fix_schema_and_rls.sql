-- ==============================================================================
-- MUTHONI AHAGO ADVOCATES (MAA LAW FIRM PORTAL)
-- SUPABASE POSTGRESQL PRODUCTION FIX: SCHEMA REPAIR & RLS ALIGNMENT
-- File: supabase/migrations/20261103000001_fix_schema_and_rls.sql
-- Strategy: Strictly Idempotent, Safe for Repeated Execution in Supabase SQL Editor
-- Directives: Non-destructive, Zero Data Deletion, Preserves All Existing Records & IDs
-- ==============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLES CREATION (IF NOT EXISTS) WITH PRIMARY KEY "id"
-- ==============================================================================

-- 1. Staff Users
CREATE TABLE IF NOT EXISTS staff_users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clients Directory
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Legal Matters
CREATE TABLE IF NOT EXISTS matters (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tasks & Subtasks
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Deadlines & Court Appearances
CREATE TABLE IF NOT EXISTS deadlines (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Activities Log
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Fee Notes (Invoices)
CREATE TABLE IF NOT EXISTS fee_notes (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Payments & Receipts
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Fee Quotations
CREATE TABLE IF NOT EXISTS quotations (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Document Folders
CREATE TABLE IF NOT EXISTS document_folders (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Documents
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Document Drafts
CREATE TABLE IF NOT EXISTS document_drafts (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Case Filed Documents (E-Filings)
CREATE TABLE IF NOT EXISTS case_filed_documents (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Client Onboardings
CREATE TABLE IF NOT EXISTS client_onboardings (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Billable Time Entries
CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. HRM Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. HRM Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Client CRM Interactions
CREATE TABLE IF NOT EXISTS client_interactions (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Firm Notice Board
CREATE TABLE IF NOT EXISTS notice_board (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Fee Note Templates
CREATE TABLE IF NOT EXISTS fee_note_templates (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Standard Services Rate Card
CREATE TABLE IF NOT EXISTS standard_services (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Chambers Firm Settings & Customization
CREATE TABLE IF NOT EXISTS chambers_settings (
    id TEXT PRIMARY KEY DEFAULT 'current_firm_profile',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Matter Confidential Notes
CREATE TABLE IF NOT EXISTS matter_notes (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Matter Timeline Events
CREATE TABLE IF NOT EXISTS matter_timeline_events (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Login Audit Logs
CREATE TABLE IF NOT EXISTS login_audit_logs (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Legal Document Templates (Template Manager)
CREATE TABLE IF NOT EXISTS legal_templates (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. Client Services Configuration
CREATE TABLE IF NOT EXISTS client_services_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. COLUMN REPAIR & AUGMENTATION (ADD COLUMN IF NOT EXISTS)
-- ==============================================================================

-- 1. staff_users
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS lsk_roll_no TEXT;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS practice_area TEXT;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS active_cases_count INTEGER DEFAULT 0;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS billable_hours_this_month NUMERIC DEFAULT 0;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS billing_rate_per_hour NUMERIC DEFAULT 0;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Advocate';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS joined_date TEXT;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS is_developer BOOLEAN DEFAULT FALSE;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS is_system_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff_users(email);

-- 2. clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Corporate';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS kra_pin TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Nairobi';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS active_matters_count INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_billed_kes NUMERIC DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS retainer_status TEXT DEFAULT 'Per-Matter';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- 3. matters
ALTER TABLE matters ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS practice_area TEXT DEFAULT 'Civil Litigation';
ALTER TABLE matters ADD COLUMN IF NOT EXISTS court_registry TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS court_case_number TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS cts_filing_id TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS responsible_advocate_id TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS responsible_advocate_name TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active - In Court';
ALTER TABLE matters ADD COLUMN IF NOT EXISTS next_deadline_date TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS next_deadline_description TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS next_court_date TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS court_date_purpose TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS estimated_fee_kes NUMERIC DEFAULT 0;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS fee_to_be_discussed_later BOOLEAN DEFAULT FALSE;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS fee_notes TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS billed_kes NUMERIC DEFAULT 0;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS paid_kes NUMERIC DEFAULT 0;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS created_date TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS lodged_date TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE matters ADD COLUMN IF NOT EXISTS documents_count INTEGER DEFAULT 0;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS opposing_party TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS conflict_check_status TEXT DEFAULT 'Cleared';
ALTER TABLE matters ADD COLUMN IF NOT EXISTS conflict_certificate_ref TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS archived_at TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS archived_by TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS archive_reason TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS created_by_advocate_id TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS created_by_name TEXT;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE matters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_matters_ref_num ON matters(reference_number);
CREATE INDEX IF NOT EXISTS idx_matters_client_id ON matters(client_id);

-- 4. tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS matter_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS matter_ref TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_email TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Not Started';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_tasks_matter_id ON tasks(matter_id);

-- 5. deadlines
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Hearing';
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS matter_id TEXT;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS matter_ref TEXT;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS matter_title TEXT;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS court_location TEXT;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS due_date TEXT;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS advocate_name TEXT;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS presiding_judge TEXT;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'High';
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_deadlines_matter_id ON deadlines(matter_id);

-- 6. activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS timestamp TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS matter_id TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS matter_ref TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_activities_matter_id ON activities(matter_id);

-- 7. notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS timestamp TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'System';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_payload JSONB;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_email);

-- 8. fee_notes
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS client_kra_pin TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS matter_id TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS matter_ref TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS matter_title TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS date_issued TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS due_date TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS subtotal_kes NUMERIC DEFAULT 0;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS discount_kes NUMERIC DEFAULT 0;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS taxable_amount_kes NUMERIC DEFAULT 0;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS non_taxable_amount_kes NUMERIC DEFAULT 0;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS disbursements_kes NUMERIC DEFAULT 0;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS amount_kes NUMERIC DEFAULT 0;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS vat_rate_percent NUMERIC DEFAULT 16;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS vat_kes NUMERIC DEFAULT 0;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS total_kes NUMERIC DEFAULT 0;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS amount_paid_kes NUMERIC DEFAULT 0;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS balance_kes NUMERIC DEFAULT 0;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Unpaid';
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS payment_ref TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS quote_id TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS quote_number TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS customer_notes TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS bank_details TEXT;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS payments_count INTEGER DEFAULT 0;
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE fee_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_fee_notes_invoice_num ON fee_notes(invoice_number);

-- 9. payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS matter_title TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_kes NUMERIC DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Bank Transfer';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS received_by TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_payments_receipt_num ON payments(receipt_number);

-- 10. quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS quote_number TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS client_kra_pin TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS matter_id TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS matter_ref TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS matter_title TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS quote_date TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS expiry_date TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS subtotal_kes NUMERIC DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS discount_kes NUMERIC DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS taxable_amount_kes NUMERIC DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS non_taxable_amount_kes NUMERIC DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS vat_kes NUMERIC DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS total_kes NUMERIC DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS converted_invoice_id TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS converted_invoice_number TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS converted_date TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_quotes_quote_num ON quotations(quote_number);

-- 11. document_folders
ALTER TABLE document_folders ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE document_folders ADD COLUMN IF NOT EXISTS parent_id TEXT;
ALTER TABLE document_folders ADD COLUMN IF NOT EXISTS matter_ref TEXT;
ALTER TABLE document_folders ADD COLUMN IF NOT EXISTS created_date TEXT;
ALTER TABLE document_folders ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0;
ALTER TABLE document_folders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE document_folders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 12. documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS matter_ref TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Pleading';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_date TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cts_receipt_no TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS current_version TEXT DEFAULT 'v1.0';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS versions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS archived_at TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS archived_by TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 13. document_drafts
ALTER TABLE document_drafts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE document_drafts ADD COLUMN IF NOT EXISTS matter_ref TEXT;
ALTER TABLE document_drafts ADD COLUMN IF NOT EXISTS folder_id TEXT;
ALTER TABLE document_drafts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE document_drafts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE document_drafts ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE document_drafts ADD COLUMN IF NOT EXISTS last_modified TEXT;
ALTER TABLE document_drafts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
ALTER TABLE document_drafts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE document_drafts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 14. case_filed_documents
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS matter_id TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS matter_ref TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS doc_type TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS filing_date TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS cts_reference TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS filed_by TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS page_count INTEGER;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS file_size TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS summary_or_prayer TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS served_date TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS created_date TEXT;
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE case_filed_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 15. client_onboardings
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'Individual';
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS id_or_reg_no TEXT;
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS matter_type TEXT;
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS assigned_advocate TEXT;
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS retainer_fee_kes NUMERIC DEFAULT 0;
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending Review';
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS submitted_date TEXT;
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 16. time_entries
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS matter_id TEXT;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS matter_ref TEXT;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS advocate_name TEXT;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS activity_type TEXT DEFAULT 'Legal Research';
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS billable BOOLEAN DEFAULT TRUE;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS hourly_rate_kes NUMERIC DEFAULT 0;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS total_fee_kes NUMERIC DEFAULT 0;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS billed BOOLEAN DEFAULT FALSE;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);

-- 17. leave_requests
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS staff_name TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type TEXT DEFAULT 'Annual Leave';
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS end_date TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS days_requested INTEGER DEFAULT 1;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS relief_staff TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS requested_on TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 18. leave_balances
-- Ensure id column exists even if created with legacy staff_name PK
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS id TEXT;
UPDATE leave_balances SET id = staff_name WHERE id IS NULL;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS staff_name TEXT;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Advocate';
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS annual_total INTEGER DEFAULT 21;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS annual_used INTEGER DEFAULT 0;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS sick_total INTEGER DEFAULT 30;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS sick_used INTEGER DEFAULT 0;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS cle_total INTEGER DEFAULT 5;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS cle_used INTEGER DEFAULT 0;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 19. client_interactions
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS interaction_type TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS subtype TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS direction TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Open';
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal';
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT FALSE;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS is_existing_client BOOLEAN DEFAULT FALSE;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS kra_pin TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS is_prospective_client BOOLEAN DEFAULT FALSE;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS converted_to_client_id TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS converted_to_matter_id TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS matter_id TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS matter_ref TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS matter_title TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS handled_by_id TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS handled_by_name TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS assigned_staff_id TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS assigned_staff_name TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS client_request_or_enquiry TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS response_provided TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS action_required TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT FALSE;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS follow_up_assigned_to_id TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS follow_up_assigned_to_name TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS follow_up_due_date TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS follow_up_status TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS follow_up_completed_date TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS linked_task_id TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS enquiry_category TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS enquiry_source TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS enquiry_status TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS enquiry_deadline TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS enquiry_resolution TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS complaint_category TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS complaint_severity TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS complaint_status TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS complaint_investigation_notes TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS complaint_resolution TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS complaint_date_resolved TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS client_satisfaction TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS visitor_pass_number TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS visitor_id_number TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS check_in_time TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS check_out_time TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS host_advocate_name TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS created_date TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS last_modified_by TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS last_modified_date TEXT;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS audit_trail JSONB DEFAULT '[]'::jsonb;
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 20. notice_board
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS posted_by TEXT;
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS posted_role TEXT;
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal';
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'All Staff';
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS event_date TEXT;
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS acknowledged_by JSONB DEFAULT '[]'::jsonb;
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE notice_board ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 21. fee_note_templates
ALTER TABLE fee_note_templates ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE fee_note_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE fee_note_templates ADD COLUMN IF NOT EXISTS practice_area TEXT;
ALTER TABLE fee_note_templates ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE fee_note_templates ADD COLUMN IF NOT EXISTS default_notes TEXT;
ALTER TABLE fee_note_templates ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE fee_note_templates ADD COLUMN IF NOT EXISTS created_date TEXT;
ALTER TABLE fee_note_templates ADD COLUMN IF NOT EXISTS last_modified TEXT;
ALTER TABLE fee_note_templates ADD COLUMN IF NOT EXISTS is_system_default BOOLEAN DEFAULT FALSE;
ALTER TABLE fee_note_templates ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE fee_note_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE fee_note_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 22. standard_services
ALTER TABLE standard_services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE standard_services ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE standard_services ADD COLUMN IF NOT EXISTS unit_price_kes NUMERIC DEFAULT 0;
ALTER TABLE standard_services ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT TRUE;
ALTER TABLE standard_services ADD COLUMN IF NOT EXISTS statutory_reference TEXT;
ALTER TABLE standard_services ADD COLUMN IF NOT EXISTS practice_area TEXT DEFAULT 'All Practice Areas';
ALTER TABLE standard_services ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE standard_services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 23. chambers_settings
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS firm_name TEXT;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS lsk_firm_reg_no TEXT;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS kra_pin TEXT;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS physical_address TEXT;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS postal_address TEXT;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS managing_partner TEXT;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}'::jsonb;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS compliance JSONB DEFAULT '{}'::jsonb;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS display_preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS customization JSONB DEFAULT '{}'::jsonb;
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS last_saved TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE chambers_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 24. matter_notes
ALTER TABLE matter_notes ADD COLUMN IF NOT EXISTS matter_id TEXT;
ALTER TABLE matter_notes ADD COLUMN IF NOT EXISTS author_id TEXT;
ALTER TABLE matter_notes ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE matter_notes ADD COLUMN IF NOT EXISTS note_content TEXT;
ALTER TABLE matter_notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE matter_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_matter_notes_matter_id ON matter_notes(matter_id);

-- 25. matter_timeline_events
ALTER TABLE matter_timeline_events ADD COLUMN IF NOT EXISTS matter_id TEXT;
ALTER TABLE matter_timeline_events ADD COLUMN IF NOT EXISTS event_title TEXT;
ALTER TABLE matter_timeline_events ADD COLUMN IF NOT EXISTS event_date TEXT;
ALTER TABLE matter_timeline_events ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE matter_timeline_events ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE matter_timeline_events ADD COLUMN IF NOT EXISTS advocate_name TEXT;
ALTER TABLE matter_timeline_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE matter_timeline_events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_matter_timeline_matter_id ON matter_timeline_events(matter_id);

-- 26. login_audit_logs
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS timestamp TEXT;
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS identifier TEXT;
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS user_role TEXT;
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS device_info TEXT;
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS login_method TEXT;
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE login_audit_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_login_audit_email ON login_audit_logs(user_email);

-- 27. legal_templates
ALTER TABLE legal_templates ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE legal_templates ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE legal_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE legal_templates ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE legal_templates ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb;
ALTER TABLE legal_templates ADD COLUMN IF NOT EXISTS last_modified TEXT;
ALTER TABLE legal_templates ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE legal_templates ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE legal_templates ADD COLUMN IF NOT EXISTS is_system_default BOOLEAN DEFAULT FALSE;
ALTER TABLE legal_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE legal_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 28. client_services_config
ALTER TABLE client_services_config ADD COLUMN IF NOT EXISTS interaction_types JSONB DEFAULT '[]'::jsonb;
ALTER TABLE client_services_config ADD COLUMN IF NOT EXISTS enquiry_categories JSONB DEFAULT '[]'::jsonb;
ALTER TABLE client_services_config ADD COLUMN IF NOT EXISTS complaint_categories JSONB DEFAULT '[]'::jsonb;
ALTER TABLE client_services_config ADD COLUMN IF NOT EXISTS client_request_types JSONB DEFAULT '[]'::jsonb;
ALTER TABLE client_services_config ADD COLUMN IF NOT EXISTS channels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE client_services_config ADD COLUMN IF NOT EXISTS auto_create_tasks_for_followups BOOLEAN DEFAULT TRUE;
ALTER TABLE client_services_config ADD COLUMN IF NOT EXISTS sla_response_hours INTEGER DEFAULT 24;
ALTER TABLE client_services_config ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE client_services_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- 3. UPDATED_AT TRIGGER FUNCTION & TRIGGERS FOR ALL TABLES
-- ==============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
    target_tables TEXT[] := ARRAY[
        'staff_users', 'clients', 'matters', 'tasks', 'deadlines', 'activities',
        'notifications', 'fee_notes', 'payments', 'quotations', 'document_folders',
        'documents', 'document_drafts', 'case_filed_documents', 'client_onboardings',
        'time_entries', 'leave_requests', 'leave_balances', 'client_interactions',
        'notice_board', 'fee_note_templates', 'standard_services', 'chambers_settings',
        'matter_notes', 'matter_timeline_events', 'login_audit_logs', 'legal_templates',
        'client_services_config'
    ];
BEGIN
    FOREACH tbl IN ARRAY target_tables LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;', tbl, tbl);
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- 4. REALTIME PUBLICATION REGISTRATION (IDEMPOTENT VIA DO $$ BLOCK)
-- ==============================================================================
DO $$
DECLARE
    tbl TEXT;
    target_tables TEXT[] := ARRAY[
        'staff_users', 'clients', 'matters', 'tasks', 'deadlines', 'activities',
        'notifications', 'fee_notes', 'payments', 'quotations', 'document_folders',
        'documents', 'document_drafts', 'case_filed_documents', 'client_onboardings',
        'time_entries', 'leave_requests', 'leave_balances', 'client_interactions',
        'notice_board', 'fee_note_templates', 'standard_services', 'chambers_settings',
        'matter_notes', 'matter_timeline_events', 'login_audit_logs', 'legal_templates',
        'client_services_config'
    ];
BEGIN
    FOREACH tbl IN ARRAY target_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I;', tbl);
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS & POLICIES
-- ==============================================================================

-- Ensure RLS is enabled on all 28 tables
DO $$
DECLARE
    tbl TEXT;
    target_tables TEXT[] := ARRAY[
        'staff_users', 'clients', 'matters', 'tasks', 'deadlines', 'activities',
        'notifications', 'fee_notes', 'payments', 'quotations', 'document_folders',
        'documents', 'document_drafts', 'case_filed_documents', 'client_onboardings',
        'time_entries', 'leave_requests', 'leave_balances', 'client_interactions',
        'notice_board', 'fee_note_templates', 'standard_services', 'chambers_settings',
        'matter_notes', 'matter_timeline_events', 'login_audit_logs', 'legal_templates',
        'client_services_config'
    ];
BEGIN
    FOREACH tbl IN ARRAY target_tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    END LOOP;
END $$;

-- Helper 1: Get current user's staff role based on authenticated email or uid
CREATE OR REPLACE FUNCTION current_staff_role()
RETURNS TEXT AS $$
DECLARE
    staff_role TEXT;
BEGIN
    SELECT role INTO staff_role
    FROM staff_users
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email') OR id = auth.uid()::text
    LIMIT 1;

    RETURN COALESCE(staff_role, 'Guest');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper 2: Check if current authenticated user is an administrator or managing advocate
CREATE OR REPLACE FUNCTION is_admin_or_managing_partner()
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT (is_system_admin OR is_developer OR role IN ('System Admin', 'Managing Advocate'))
    INTO is_admin
    FROM staff_users
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email') OR id = auth.uid()::text
    LIMIT 1;

    RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper 3: Check if current authenticated user has billing rights
CREATE OR REPLACE FUNCTION has_billing_permission()
RETURNS BOOLEAN AS $$
DECLARE
    can_billing BOOLEAN;
BEGIN
    SELECT (
        is_system_admin 
        OR is_developer 
        OR role IN ('System Admin', 'Managing Advocate') 
        OR (permissions->>'canEditBilling')::boolean = true 
        OR (permissions->>'canViewFinancialInsights')::boolean = true
    )
    INTO can_billing
    FROM staff_users
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email') OR id = auth.uid()::text
    LIMIT 1;

    RETURN COALESCE(can_billing, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- POLICIES: 1. staff_users
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view roster" ON staff_users;
CREATE POLICY "Staff can view roster"
    ON staff_users FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage staff roster" ON staff_users;
CREATE POLICY "Admins can manage staff roster"
    ON staff_users FOR ALL
    TO authenticated
    USING (is_admin_or_managing_partner())
    WITH CHECK (is_admin_or_managing_partner());

-- ------------------------------------------------------------------------------
-- POLICIES: 2. clients
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view clients" ON clients;
CREATE POLICY "Staff can view clients"
    ON clients FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff can insert/update clients" ON clients;
CREATE POLICY "Staff can insert/update clients"
    ON clients FOR ALL
    TO authenticated
    USING (current_staff_role() IN ('System Admin', 'Managing Advocate', 'Advocate', 'Consultant Advocate', 'Office Manager'))
    WITH CHECK (current_staff_role() IN ('System Admin', 'Managing Advocate', 'Advocate', 'Consultant Advocate', 'Office Manager'));

-- ------------------------------------------------------------------------------
-- POLICIES: 3. matters
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view matters" ON matters;
CREATE POLICY "Staff can view matters"
    ON matters FOR SELECT
    TO authenticated
    USING (
        is_admin_or_managing_partner()
        OR current_staff_role() IN ('Office Manager', 'Legal Support Clerk')
        OR responsible_advocate_id = auth.uid()::text
        OR responsible_advocate_id IN (SELECT id FROM staff_users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email'))
        OR created_by_advocate_id = auth.uid()::text
        OR created_by_advocate_id IN (SELECT id FROM staff_users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email'))
        OR EXISTS (
            SELECT 1 FROM staff_users 
            WHERE (LOWER(email) = LOWER(auth.jwt() ->> 'email') OR id = auth.uid()::text) 
            AND (permissions->>'canViewAllMatters')::boolean = true
        )
    );

DROP POLICY IF EXISTS "Staff can manage matters" ON matters;
CREATE POLICY "Staff can manage matters"
    ON matters FOR ALL
    TO authenticated
    USING (current_staff_role() IN ('System Admin', 'Managing Advocate', 'Advocate', 'Consultant Advocate', 'Office Manager'))
    WITH CHECK (current_staff_role() IN ('System Admin', 'Managing Advocate', 'Advocate', 'Consultant Advocate', 'Office Manager'));

-- ------------------------------------------------------------------------------
-- POLICIES: 4. tasks, 5. deadlines, 6. activities
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view and manage tasks" ON tasks;
CREATE POLICY "Staff can view and manage tasks"
    ON tasks FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can view and manage deadlines" ON deadlines;
CREATE POLICY "Staff can view and manage deadlines"
    ON deadlines FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can view activities" ON activities;
CREATE POLICY "Staff can view activities"
    ON activities FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff can log activities" ON activities;
CREATE POLICY "Staff can log activities"
    ON activities FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete activities" ON activities;
CREATE POLICY "Admins can delete activities"
    ON activities FOR DELETE
    TO authenticated
    USING (is_admin_or_managing_partner());

-- ------------------------------------------------------------------------------
-- POLICIES: 7. notifications
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view their notifications" ON notifications;
CREATE POLICY "Staff can view their notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (
        LOWER(recipient_email) = LOWER(auth.jwt() ->> 'email')
        OR recipient_email IS NULL
        OR is_admin_or_managing_partner()
    );

DROP POLICY IF EXISTS "Staff can update notifications" ON notifications;
CREATE POLICY "Staff can update notifications"
    ON notifications FOR ALL
    TO authenticated
    USING (
        LOWER(recipient_email) = LOWER(auth.jwt() ->> 'email')
        OR recipient_email IS NULL
        OR is_admin_or_managing_partner()
    )
    WITH CHECK (
        LOWER(recipient_email) = LOWER(auth.jwt() ->> 'email')
        OR recipient_email IS NULL
        OR is_admin_or_managing_partner()
    );

-- ------------------------------------------------------------------------------
-- POLICIES: 8. fee_notes, 9. payments, 10. quotations
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff with billing rights can view fee_notes" ON fee_notes;
CREATE POLICY "Staff with billing rights can view fee_notes"
    ON fee_notes FOR SELECT
    TO authenticated
    USING (has_billing_permission());

DROP POLICY IF EXISTS "Staff with billing rights can manage fee_notes" ON fee_notes;
CREATE POLICY "Staff with billing rights can manage fee_notes"
    ON fee_notes FOR ALL
    TO authenticated
    USING (has_billing_permission())
    WITH CHECK (has_billing_permission());

DROP POLICY IF EXISTS "Staff with billing rights can view payments" ON payments;
CREATE POLICY "Staff with billing rights can view payments"
    ON payments FOR SELECT
    TO authenticated
    USING (has_billing_permission());

DROP POLICY IF EXISTS "Staff with billing rights can manage payments" ON payments;
CREATE POLICY "Staff with billing rights can manage payments"
    ON payments FOR ALL
    TO authenticated
    USING (has_billing_permission())
    WITH CHECK (has_billing_permission());

DROP POLICY IF EXISTS "Staff with billing rights can view quotations" ON quotations;
CREATE POLICY "Staff with billing rights can view quotations"
    ON quotations FOR SELECT
    TO authenticated
    USING (has_billing_permission());

DROP POLICY IF EXISTS "Staff with billing rights can manage quotations" ON quotations;
CREATE POLICY "Staff with billing rights can manage quotations"
    ON quotations FOR ALL
    TO authenticated
    USING (has_billing_permission())
    WITH CHECK (has_billing_permission());

-- ------------------------------------------------------------------------------
-- POLICIES: 11. document_folders, 12. documents, 13. document_drafts, 14. case_filed_documents
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can manage document folders" ON document_folders;
CREATE POLICY "Staff can manage document folders"
    ON document_folders FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage documents" ON documents;
CREATE POLICY "Staff can manage documents"
    ON documents FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage document drafts" ON document_drafts;
CREATE POLICY "Staff can manage document drafts"
    ON document_drafts FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage case filed documents" ON case_filed_documents;
CREATE POLICY "Staff can manage case filed documents"
    ON case_filed_documents FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- POLICIES: 15. client_onboardings, 16. time_entries, 17. leave_requests, 18. leave_balances
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can manage client onboardings" ON client_onboardings;
CREATE POLICY "Staff can manage client onboardings"
    ON client_onboardings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can view time entries" ON time_entries;
CREATE POLICY "Staff can view time entries"
    ON time_entries FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff can manage time entries" ON time_entries;
CREATE POLICY "Staff can manage time entries"
    ON time_entries FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can view leave requests" ON leave_requests;
CREATE POLICY "Staff can view leave requests"
    ON leave_requests FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff can manage leave requests" ON leave_requests;
CREATE POLICY "Staff can manage leave requests"
    ON leave_requests FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can view leave balances" ON leave_balances;
CREATE POLICY "Staff can view leave balances"
    ON leave_balances FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff can manage leave balances" ON leave_balances;
CREATE POLICY "Staff can manage leave balances"
    ON leave_balances FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- POLICIES: 19. client_interactions, 20. notice_board, 21. fee_note_templates, 22. standard_services
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can manage client interactions" ON client_interactions;
CREATE POLICY "Staff can manage client interactions"
    ON client_interactions FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can view notice board" ON notice_board;
CREATE POLICY "Staff can view notice board"
    ON notice_board FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff can manage notice board" ON notice_board;
CREATE POLICY "Staff can manage notice board"
    ON notice_board FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can view fee note templates" ON fee_note_templates;
CREATE POLICY "Staff can view fee note templates"
    ON fee_note_templates FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff can manage fee note templates" ON fee_note_templates;
CREATE POLICY "Staff can manage fee note templates"
    ON fee_note_templates FOR ALL
    TO authenticated
    USING (has_billing_permission())
    WITH CHECK (has_billing_permission());

DROP POLICY IF EXISTS "Staff can view standard services" ON standard_services;
CREATE POLICY "Staff can view standard services"
    ON standard_services FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff can manage standard services" ON standard_services;
CREATE POLICY "Staff can manage standard services"
    ON standard_services FOR ALL
    TO authenticated
    USING (has_billing_permission())
    WITH CHECK (has_billing_permission());

-- ------------------------------------------------------------------------------
-- POLICIES: 23. chambers_settings
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view chambers settings" ON chambers_settings;
CREATE POLICY "Staff can view chambers settings"
    ON chambers_settings FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage chambers settings" ON chambers_settings;
CREATE POLICY "Admins can manage chambers settings"
    ON chambers_settings FOR ALL
    TO authenticated
    USING (is_admin_or_managing_partner())
    WITH CHECK (is_admin_or_managing_partner());

-- ------------------------------------------------------------------------------
-- POLICIES: 24. matter_notes, 25. matter_timeline_events
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can manage matter notes" ON matter_notes;
CREATE POLICY "Staff can manage matter notes"
    ON matter_notes FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage matter timeline events" ON matter_timeline_events;
CREATE POLICY "Staff can manage matter timeline events"
    ON matter_timeline_events FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- POLICIES: 26. login_audit_logs
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view login audit logs" ON login_audit_logs;
CREATE POLICY "Admins can view login audit logs"
    ON login_audit_logs FOR SELECT
    TO authenticated
    USING (is_admin_or_managing_partner());

DROP POLICY IF EXISTS "System can log login attempts" ON login_audit_logs;
CREATE POLICY "System can log login attempts"
    ON login_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- POLICIES: 27. legal_templates
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view legal templates" ON legal_templates;
CREATE POLICY "Staff can view legal templates"
    ON legal_templates FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff can manage legal templates" ON legal_templates;
CREATE POLICY "Staff can manage legal templates"
    ON legal_templates FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- POLICIES: 28. client_services_config
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view client services config" ON client_services_config;
CREATE POLICY "Staff can view client services config"
    ON client_services_config FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage client services config" ON client_services_config;
CREATE POLICY "Admins can manage client services config"
    ON client_services_config FOR ALL
    TO authenticated
    USING (is_admin_or_managing_partner())
    WITH CHECK (is_admin_or_managing_partner());

-- ==============================================================================
-- 6. NOTIFY POSTGREST SCHEMA CACHE RELOAD
-- ==============================================================================
notify pgrst, 'reload schema';

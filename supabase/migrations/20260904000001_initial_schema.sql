-- ==============================================================================
-- MUTHONI AHAGO ADVOCATES (MAA LAW FIRM PORTAL)
-- SUPABASE POSTGRESQL INITIAL DATABASE SCHEMA
-- Migration: 20260904000001_initial_schema.sql
-- Strategy: Strictly Additive, Non-Destructive, ID-Preserving (TEXT PRIMARY KEY)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. STAFF / USERS TABLE
-- Maps to: Advocate interface and localStorage key 'muthoni_ahago_staff_roster_v12'
-- ID Preservation: Existing IDs like 'dev-admin', 'adv-1', 'staff-clerk-1', 'staff-om-1'
CREATE TABLE IF NOT EXISTS staff_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    lsk_roll_no TEXT,
    avatar TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    practice_area TEXT,
    active_cases_count INTEGER DEFAULT 0,
    billable_hours_this_month NUMERIC DEFAULT 0,
    billing_rate_per_hour NUMERIC DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'Advocate',
    status TEXT NOT NULL DEFAULT 'Active',
    joined_date TEXT,
    is_developer BOOLEAN DEFAULT FALSE,
    is_system_admin BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_email ON staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff_users(role);

-- 3. CLIENTS TABLE
-- Maps to: Client interface and localStorage key 'muthoni_ahago_clients_v1'
-- ID Preservation: Existing IDs like 'client-1', 'client-2'
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Corporate',
    industry TEXT,
    kra_pin TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    city TEXT DEFAULT 'Nairobi',
    active_matters_count INTEGER DEFAULT 0,
    total_billed_kes NUMERIC DEFAULT 0,
    retainer_status TEXT DEFAULT 'Per-Matter',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_kra_pin ON clients(kra_pin);

-- 4. MATTERS TABLE
-- Maps to: LegalMatter interface and localStorage key 'muthoni_ahago_matters_v1'
-- ID Preservation: Existing IDs like 'mat-1', 'MAA/HC/COM/2026/0142'
CREATE TABLE IF NOT EXISTS matters (
    id TEXT PRIMARY KEY,
    reference_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    practice_area TEXT NOT NULL,
    court_registry TEXT,
    court_case_number TEXT,
    cts_filing_id TEXT,
    responsible_advocate_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
    responsible_advocate_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active - In Court',
    next_deadline_date TEXT,
    next_deadline_description TEXT,
    next_court_date TEXT,
    court_date_purpose TEXT,
    estimated_fee_kes NUMERIC DEFAULT 0,
    fee_to_be_discussed_later BOOLEAN DEFAULT FALSE,
    fee_notes TEXT,
    billed_kes NUMERIC DEFAULT 0,
    paid_kes NUMERIC DEFAULT 0,
    created_date TEXT NOT NULL,
    lodged_date TEXT,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'Medium',
    documents_count INTEGER DEFAULT 0,
    opposing_party TEXT,
    conflict_check_status TEXT DEFAULT 'Cleared',
    conflict_certificate_ref TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    archived_at TEXT,
    archived_by TEXT,
    archive_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matters_ref_num ON matters(reference_number);
CREATE INDEX IF NOT EXISTS idx_matters_client_id ON matters(client_id);
CREATE INDEX IF NOT EXISTS idx_matters_responsible_advocate ON matters(responsible_advocate_id);
CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(status);

-- 5. TASKS TABLE
-- Maps to: TaskItem interface and localStorage key 'muthoni_ahago_tasks_v1'
-- ID Preservation: Existing IDs like 'task-1', 'task-2'
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    matter_id TEXT REFERENCES matters(id) ON DELETE SET NULL,
    matter_ref TEXT,
    client_name TEXT,
    assigned_to TEXT NOT NULL,
    created_by TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Not Started',
    start_date TEXT,
    due_date TEXT NOT NULL,
    estimated_hours NUMERIC DEFAULT 0,
    actual_hours NUMERIC DEFAULT 0,
    subtasks JSONB DEFAULT '[]'::jsonb,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_matter_id ON tasks(matter_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- 6. DEADLINES TABLE
-- Maps to: DeadlineItem interface and localStorage key 'muthoni_ahago_deadlines_v1'
-- ID Preservation: Existing IDs like 'dl-1', 'dl-2'
CREATE TABLE IF NOT EXISTS deadlines (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    matter_id TEXT REFERENCES matters(id) ON DELETE CASCADE,
    matter_ref TEXT,
    matter_title TEXT NOT NULL,
    category TEXT NOT NULL,
    due_date TEXT NOT NULL,
    time TEXT NOT NULL,
    court_location TEXT,
    presiding_judge TEXT,
    advocate_name TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'High',
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deadlines_matter_id ON deadlines(matter_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON deadlines(due_date);

-- 7. ACTIVITIES TABLE
-- Maps to: ActivityLog interface and localStorage key 'muthoni_ahago_activities_v1'
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    timestamp TEXT NOT NULL,
    user_name TEXT NOT NULL,
    matter_id TEXT REFERENCES matters(id) ON DELETE CASCADE,
    matter_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_matter_id ON activities(matter_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);

-- 8. NOTIFICATIONS TABLE
-- Maps to: NotificationItem interface and localStorage key 'muthoni_ahago_notifications_v1'
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    type TEXT NOT NULL DEFAULT 'System',
    recipient_email TEXT,
    email_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 9. FEE NOTES (INVOICES) TABLE
-- Maps to: FeeNote interface and localStorage key 'muthoni_ahago_fee_notes_v1'
-- ID Preservation: Existing IDs like 'fn-1', 'MAA-INV-2026-088'
CREATE TABLE IF NOT EXISTS fee_notes (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    client_email TEXT,
    client_kra_pin TEXT,
    client_address TEXT,
    matter_id TEXT REFERENCES matters(id) ON DELETE SET NULL,
    matter_ref TEXT,
    matter_title TEXT NOT NULL,
    date_issued TEXT NOT NULL,
    due_date TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal_kes NUMERIC DEFAULT 0,
    discount_kes NUMERIC DEFAULT 0,
    taxable_amount_kes NUMERIC DEFAULT 0,
    non_taxable_amount_kes NUMERIC DEFAULT 0,
    disbursements_kes NUMERIC DEFAULT 0,
    amount_kes NUMERIC NOT NULL DEFAULT 0,
    vat_rate_percent NUMERIC DEFAULT 16,
    vat_kes NUMERIC DEFAULT 0,
    total_kes NUMERIC NOT NULL DEFAULT 0,
    amount_paid_kes NUMERIC DEFAULT 0,
    balance_kes NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Unpaid',
    payment_ref TEXT,
    quote_id TEXT,
    quote_number TEXT,
    notes TEXT,
    bank_details TEXT,
    payments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_notes_invoice_num ON fee_notes(invoice_number);
CREATE INDEX IF NOT EXISTS idx_fee_notes_client_id ON fee_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_fee_notes_matter_id ON fee_notes(matter_id);
CREATE INDEX IF NOT EXISTS idx_fee_notes_status ON fee_notes(status);

-- 10. PAYMENTS TABLE
-- Maps to: PaymentRecord interface and localStorage key 'muthoni_ahago_payments_v1'
-- ID Preservation: Existing IDs like 'pay-1', 'MAA-RCP-2026-001'
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    receipt_number TEXT NOT NULL UNIQUE,
    payment_reference TEXT NOT NULL,
    invoice_id TEXT REFERENCES fee_notes(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    matter_title TEXT,
    amount_kes NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    payment_date TEXT NOT NULL,
    notes TEXT,
    received_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_receipt_num ON payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);

-- 11. QUOTATIONS TABLE
-- Maps to: Quotation interface and localStorage key 'muthoni_ahago_quotes_v1'
-- ID Preservation: Existing IDs like 'quo-1', 'MAA-QUO-2026-001'
CREATE TABLE IF NOT EXISTS quotations (
    id TEXT PRIMARY KEY,
    quote_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    client_kra_pin TEXT,
    matter_id TEXT REFERENCES matters(id) ON DELETE SET NULL,
    matter_ref TEXT,
    matter_title TEXT,
    quote_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal_kes NUMERIC NOT NULL DEFAULT 0,
    discount_percent NUMERIC DEFAULT 0,
    discount_kes NUMERIC DEFAULT 0,
    taxable_amount_kes NUMERIC DEFAULT 0,
    non_taxable_amount_kes NUMERIC DEFAULT 0,
    vat_kes NUMERIC DEFAULT 0,
    total_kes NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft',
    notes TEXT,
    terms_and_conditions TEXT,
    converted_invoice_id TEXT,
    converted_invoice_number TEXT,
    converted_date TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_quote_num ON quotations(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotations(client_id);

-- 12. DOCUMENT FOLDERS TABLE
-- Maps to: DocumentFolder interface and localStorage key 'muthoni_ahago_folders_v1'
CREATE TABLE IF NOT EXISTS document_folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT REFERENCES document_folders(id) ON DELETE CASCADE,
    matter_ref TEXT,
    created_date TEXT NOT NULL,
    item_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON document_folders(parent_id);

-- 13. DOCUMENTS TABLE
-- Maps to: DocumentItem interface and localStorage key 'muthoni_ahago_documents_v1'
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    matter_ref TEXT,
    category TEXT NOT NULL,
    file_size TEXT,
    uploaded_by TEXT NOT NULL,
    uploaded_date TEXT NOT NULL,
    cts_receipt_no TEXT,
    current_version TEXT,
    versions JSONB DEFAULT '[]'::jsonb,
    folder_id TEXT REFERENCES document_folders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_matter_ref ON documents(matter_ref);
CREATE INDEX IF NOT EXISTS idx_docs_folder_id ON documents(folder_id);

-- 14. DOCUMENT DRAFTS TABLE
-- Maps to: DocumentDraft interface and localStorage key 'muthoni_ahago_drafts_v1'
CREATE TABLE IF NOT EXISTS document_drafts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    matter_ref TEXT NOT NULL,
    folder_id TEXT REFERENCES document_folders(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    last_modified TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CASE FILED DOCUMENTS TABLE (E-FILINGS)
-- Maps to: CaseFiledDocument and dynamic keys 'maa_case_filed_docs_<matterId>'
CREATE TABLE IF NOT EXISTS case_filed_documents (
    id TEXT PRIMARY KEY,
    matter_id TEXT REFERENCES matters(id) ON DELETE CASCADE,
    matter_ref TEXT NOT NULL,
    title TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    filing_date TEXT NOT NULL,
    cts_reference TEXT,
    filed_by TEXT NOT NULL,
    status TEXT NOT NULL,
    page_count INTEGER,
    file_size TEXT,
    summary_or_prayer TEXT,
    served_date TEXT,
    pdf_url TEXT,
    created_date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_filed_matter_id ON case_filed_documents(matter_id);

-- 16. CLIENT ONBOARDINGS TABLE
-- Maps to: ClientOnboardingSubmission and localStorage key 'muthoni_ahago_onboardings_v1'
CREATE TABLE IF NOT EXISTS client_onboardings (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_type TEXT NOT NULL,
    id_or_reg_no TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    matter_type TEXT,
    assigned_advocate TEXT,
    retainer_fee_kes NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pending Review',
    submitted_date TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. LEAVE REQUESTS TABLE (HRM)
-- Maps to: StoredLeaveRequest and localStorage key 'muthoni_ahago_leave_requests_v1'
CREATE TABLE IF NOT EXISTS leave_requests (
    id TEXT PRIMARY KEY,
    staff_name TEXT NOT NULL,
    role TEXT NOT NULL,
    leave_type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    days_requested INTEGER NOT NULL,
    reason TEXT NOT NULL,
    relief_staff TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    requested_on TEXT NOT NULL,
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_staff ON leave_requests(staff_name);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- 18. LEAVE BALANCES TABLE (HRM)
-- Maps to: StoredLeaveBalance and localStorage key 'muthoni_ahago_leave_balances_v1'
-- Primary Key: staff_name (as uniquely tracked per staff member)
CREATE TABLE IF NOT EXISTS leave_balances (
    staff_name TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    annual_total INTEGER DEFAULT 21,
    annual_used INTEGER DEFAULT 0,
    sick_total INTEGER DEFAULT 30,
    sick_used INTEGER DEFAULT 0,
    cle_total INTEGER DEFAULT 5,
    cle_used INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. CLIENT INTERACTIONS (CRM & CLIENT SERVICES)
-- Maps to: ClientInteraction and localStorage key 'chambers_client_interactions_clean_v2'
-- ID Preservation: Existing IDs like 'INT-2026-0042'
CREATE TABLE IF NOT EXISTS client_interactions (
    id TEXT PRIMARY KEY,
    interaction_type TEXT NOT NULL,
    subtype TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration_minutes INTEGER,
    channel TEXT NOT NULL,
    direction TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    priority TEXT NOT NULL DEFAULT 'Normal',
    is_confidential BOOLEAN DEFAULT FALSE,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    is_existing_client BOOLEAN DEFAULT FALSE,
    contact_person TEXT,
    phone_number TEXT,
    email TEXT,
    company_name TEXT,
    kra_pin TEXT,
    is_prospective_client BOOLEAN DEFAULT FALSE,
    converted_to_client_id TEXT,
    converted_to_matter_id TEXT,
    matter_id TEXT REFERENCES matters(id) ON DELETE SET NULL,
    matter_ref TEXT,
    matter_title TEXT,
    handled_by_id TEXT,
    handled_by_name TEXT NOT NULL,
    assigned_staff_id TEXT,
    assigned_staff_name TEXT,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    client_request_or_enquiry TEXT,
    response_provided TEXT,
    outcome TEXT,
    action_required TEXT,
    internal_notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_assigned_to_id TEXT,
    follow_up_assigned_to_name TEXT,
    follow_up_due_date TEXT,
    follow_up_status TEXT,
    follow_up_notes TEXT,
    follow_up_completed_date TEXT,
    linked_task_id TEXT,
    enquiry_category TEXT,
    enquiry_source TEXT,
    enquiry_status TEXT,
    enquiry_deadline TEXT,
    enquiry_resolution TEXT,
    complaint_category TEXT,
    complaint_severity TEXT,
    complaint_status TEXT,
    complaint_investigation_notes TEXT,
    complaint_resolution TEXT,
    complaint_date_resolved TEXT,
    client_satisfaction TEXT,
    visitor_pass_number TEXT,
    visitor_id_number TEXT,
    check_in_time TEXT,
    check_out_time TEXT,
    host_advocate_name TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_by TEXT NOT NULL,
    created_date TEXT NOT NULL,
    last_modified_by TEXT,
    last_modified_date TEXT,
    audit_trail JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_client_id ON client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_matter_id ON client_interactions(matter_id);
CREATE INDEX IF NOT EXISTS idx_interactions_status ON client_interactions(status);

-- 20. NOTICE BOARD TABLE
-- Maps to: NoticeBoardItem and localStorage key 'chambers_notice_board_items_v3'
CREATE TABLE IF NOT EXISTS notice_board (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    posted_by TEXT NOT NULL,
    posted_role TEXT,
    date TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Normal',
    pinned BOOLEAN DEFAULT FALSE,
    target_audience TEXT DEFAULT 'All Staff',
    event_date TEXT,
    location TEXT,
    acknowledged_by JSONB DEFAULT '[]'::jsonb,
    reactions JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. FEE NOTE TEMPLATES TABLE
-- Maps to: FeeNoteTemplate and localStorage key 'maa_chambers_fee_note_templates_v1'
CREATE TABLE IF NOT EXISTS fee_note_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    practice_area TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    default_notes TEXT,
    author TEXT NOT NULL,
    created_date TEXT NOT NULL,
    last_modified TEXT NOT NULL,
    is_system_default BOOLEAN DEFAULT FALSE,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. STANDARD SERVICES RATE CARD TABLE
-- Maps to: StandardServiceItem and localStorage key 'maa_chambers_standard_services_v1'
CREATE TABLE IF NOT EXISTS standard_services (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_price_kes NUMERIC NOT NULL,
    is_taxable BOOLEAN DEFAULT TRUE,
    statutory_reference TEXT,
    practice_area TEXT DEFAULT 'All Practice Areas',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. CHAMBERS SETTINGS & FIRM PROFILE
-- Maps to: ChambersSettings and localStorage key 'muthoni_ahago_chambers_settings_v1'
CREATE TABLE IF NOT EXISTS chambers_settings (
    id TEXT PRIMARY KEY DEFAULT 'current_firm_profile',
    firm_name TEXT NOT NULL,
    tagline TEXT,
    logo_url TEXT,
    lsk_firm_reg_no TEXT,
    kra_pin TEXT,
    physical_address TEXT,
    postal_address TEXT,
    phone TEXT,
    email TEXT,
    billing_email TEXT,
    website TEXT,
    managing_partner TEXT,
    bank_details JSONB DEFAULT '{}'::jsonb,
    integrations JSONB DEFAULT '{}'::jsonb,
    compliance JSONB DEFAULT '{}'::jsonb,
    display_preferences JSONB DEFAULT '{}'::jsonb,
    last_saved TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. MATTER CASE NOTES & TIMELINE EVENTS
-- Maps to dynamic keys 'chambers_matter_notes_<matterId>' and 'chambers_timeline_events_<matterId>'
CREATE TABLE IF NOT EXISTS matter_notes (
    id TEXT PRIMARY KEY,
    matter_id TEXT NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    author_id TEXT,
    author_name TEXT NOT NULL,
    note_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matter_notes_matter_id ON matter_notes(matter_id);

CREATE TABLE IF NOT EXISTS matter_timeline_events (
    id TEXT PRIMARY KEY,
    matter_id TEXT NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    event_title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_type TEXT,
    details TEXT,
    advocate_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matter_timeline_matter_id ON matter_timeline_events(matter_id);

-- 25. AUDIT LOGS & LOGIN RECORDS
-- Maps to: LoginAuditEntry and localStorage key 'muthoni_ahago_login_audit_logs_v2'
CREATE TABLE IF NOT EXISTS login_audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    identifier TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT,
    status TEXT NOT NULL,
    failure_reason TEXT,
    ip_address TEXT,
    location TEXT,
    device_info TEXT,
    login_method TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_audit_email ON login_audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_login_audit_timestamp ON login_audit_logs(timestamp);

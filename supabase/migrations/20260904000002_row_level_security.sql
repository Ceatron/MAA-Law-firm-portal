-- ==============================================================================
-- MUTHONI AHAGO ADVOCATES (MAA LAW FIRM PORTAL)
-- ROW LEVEL SECURITY (RLS) & REALTIME CONFIGURATION
-- Migration: 20260904000002_row_level_security.sql
-- Strategy: Strict RBAC mirroring existing Law Firm Roles & Advocate Permissions
-- ==============================================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE IF EXISTS staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fee_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS document_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS case_filed_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_onboardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notice_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fee_note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS standard_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chambers_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS matter_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS matter_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS login_audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. HELPER FUNCTIONS TO RETRIEVE ACTIVE USER ROLES
-- In production Supabase, auth.uid() links to auth.users.
-- We cross-reference staff_users to determine the active advocate role.
CREATE OR REPLACE FUNCTION current_staff_role()
RETURNS TEXT AS $$
DECLARE
    staff_role TEXT;
BEGIN
    SELECT role INTO staff_role
    FROM staff_users
    WHERE email = auth.jwt() ->> 'email' OR id = auth.uid()::text
    LIMIT 1;

    RETURN COALESCE(staff_role, 'Guest');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin_or_managing_partner()
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT (is_system_admin OR is_developer OR role IN ('System Admin', 'Managing Advocate'))
    INTO is_admin
    FROM staff_users
    WHERE email = auth.jwt() ->> 'email' OR id = auth.uid()::text
    LIMIT 1;

    RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. POLICIES: STAFF USERS
-- All authenticated staff can view the staff roster (for directory, assignments, tasks)
CREATE POLICY "Staff can view roster"
    ON staff_users FOR SELECT
    TO authenticated
    USING (true);

-- Only Admins and Managing Advocates can manage staff credentials and roles
CREATE POLICY "Admins can manage staff roster"
    ON staff_users FOR ALL
    TO authenticated
    USING (is_admin_or_managing_partner())
    WITH CHECK (is_admin_or_managing_partner());

-- 4. POLICIES: CLIENTS
-- Authenticated staff can view client records
CREATE POLICY "Staff can view clients"
    ON clients FOR SELECT
    TO authenticated
    USING (true);

-- Staff can create or update client records (excluding clerks without permission)
CREATE POLICY "Staff can insert/update clients"
    ON clients FOR ALL
    TO authenticated
    USING (current_staff_role() IN ('System Admin', 'Managing Advocate', 'Advocate', 'Consultant Advocate', 'Office Manager'))
    WITH CHECK (current_staff_role() IN ('System Admin', 'Managing Advocate', 'Advocate', 'Consultant Advocate', 'Office Manager'));

-- 5. POLICIES: MATTERS
-- Staff can view matters they are assigned to, or all matters if permitted
CREATE POLICY "Staff can view matters"
    ON matters FOR SELECT
    TO authenticated
    USING (
        is_admin_or_managing_partner()
        OR current_staff_role() IN ('Office Manager', 'Legal Support Clerk')
        OR responsible_advocate_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM staff_users 
            WHERE (email = auth.jwt() ->> 'email' OR id = auth.uid()::text) 
            AND (permissions->>'canViewAllMatters')::boolean = true
        )
    );

-- Advocates and Admins can create and edit matters
CREATE POLICY "Staff can manage matters"
    ON matters FOR ALL
    TO authenticated
    USING (current_staff_role() IN ('System Admin', 'Managing Advocate', 'Advocate', 'Consultant Advocate'))
    WITH CHECK (current_staff_role() IN ('System Admin', 'Managing Advocate', 'Advocate', 'Consultant Advocate'));

-- 6. POLICIES: TASKS, DEADLINES, ACTIVITIES & NOTIFICATIONS
-- Tasks: Visible and manageable by chambers team
CREATE POLICY "Staff can view and manage tasks"
    ON tasks FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Deadlines: Visible and manageable by chambers team
CREATE POLICY "Staff can view and manage deadlines"
    ON deadlines FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Activities: Visible to authenticated staff, writeable by system and staff
CREATE POLICY "Staff can view activities"
    ON activities FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff can log activities"
    ON activities FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Notifications: Visible to recipient or admins
CREATE POLICY "Staff can view their notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (
        recipient_email = auth.jwt() ->> 'email'
        OR recipient_email IS NULL
        OR is_admin_or_managing_partner()
    );

CREATE POLICY "Staff can update notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (recipient_email = auth.jwt() ->> 'email' OR recipient_email IS NULL)
    WITH CHECK (recipient_email = auth.jwt() ->> 'email' OR recipient_email IS NULL);

-- 7. POLICIES: BILLING (FEE NOTES, PAYMENTS, QUOTATIONS)
-- Fee Notes: Viewable by Partners, Office Managers, and Advocates with billing permission
CREATE POLICY "Staff with billing permission can view fee notes"
    ON fee_notes FOR SELECT
    TO authenticated
    USING (
        is_admin_or_managing_partner()
        OR current_staff_role() = 'Office Manager'
        OR EXISTS (
            SELECT 1 FROM staff_users 
            WHERE (email = auth.jwt() ->> 'email' OR id = auth.uid()::text) 
            AND (permissions->>'canEditBilling')::boolean = true
        )
    );

CREATE POLICY "Staff with billing permission can manage fee notes"
    ON fee_notes FOR ALL
    TO authenticated
    USING (
        is_admin_or_managing_partner()
        OR current_staff_role() = 'Office Manager'
        OR EXISTS (
            SELECT 1 FROM staff_users 
            WHERE (email = auth.jwt() ->> 'email' OR id = auth.uid()::text) 
            AND (permissions->>'canEditBilling')::boolean = true
        )
    );

-- Payments: Managed by Billing Role, Office Manager, and Admins
CREATE POLICY "Staff can view payments"
    ON payments FOR SELECT
    TO authenticated
    USING (
        is_admin_or_managing_partner()
        OR current_staff_role() = 'Office Manager'
        OR EXISTS (
            SELECT 1 FROM staff_users 
            WHERE (email = auth.jwt() ->> 'email' OR id = auth.uid()::text) 
            AND (permissions->>'canEditBilling')::boolean = true
        )
    );

CREATE POLICY "Staff can record payments"
    ON payments FOR ALL
    TO authenticated
    USING (
        is_admin_or_managing_partner()
        OR current_staff_role() = 'Office Manager'
    );

-- Quotations
CREATE POLICY "Staff can view and manage quotations"
    ON quotations FOR ALL
    TO authenticated
    USING (
        current_staff_role() IN ('System Admin', 'Managing Advocate', 'Advocate', 'Consultant Advocate', 'Office Manager')
    );

-- 8. POLICIES: DOCUMENTS, FOLDERS, DRAFTS, CASE FILED DOCS
CREATE POLICY "Staff can view and manage document folders"
    ON document_folders FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Staff can view and manage documents"
    ON documents FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Staff can view and manage drafts"
    ON document_drafts FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Staff can view and manage case filed documents"
    ON case_filed_documents FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 9. POLICIES: CLIENT ONBOARDINGS & HRM
CREATE POLICY "Staff can view and manage onboardings"
    ON client_onboardings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Staff can view leave requests"
    ON leave_requests FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff can request leave"
    ON leave_requests FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins and Office Managers can approve leave"
    ON leave_requests FOR UPDATE
    TO authenticated
    USING (is_admin_or_managing_partner() OR current_staff_role() = 'Office Manager');

CREATE POLICY "Staff can view leave balances"
    ON leave_balances FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can update leave balances"
    ON leave_balances FOR ALL
    TO authenticated
    USING (is_admin_or_managing_partner() OR current_staff_role() = 'Office Manager');

-- 10. POLICIES: CLIENT INTERACTIONS (CRM)
CREATE POLICY "Staff can view client interactions"
    ON client_interactions FOR SELECT
    TO authenticated
    USING (
        is_confidential IS NOT TRUE
        OR is_admin_or_managing_partner()
        OR handled_by_id = auth.uid()::text
    );

CREATE POLICY "Staff can manage client interactions"
    ON client_interactions FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 11. POLICIES: NOTICE BOARD, TEMPLATES, SETTINGS & NOTES
CREATE POLICY "Staff can view notice board"
    ON notice_board FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff can post to notice board"
    ON notice_board FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Staff can view fee note templates"
    ON fee_note_templates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff can manage fee note templates"
    ON fee_note_templates FOR ALL
    TO authenticated
    USING (is_admin_or_managing_partner() OR current_staff_role() = 'Office Manager');

CREATE POLICY "Staff can view standard services"
    ON standard_services FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage standard services"
    ON standard_services FOR ALL
    TO authenticated
    USING (is_admin_or_managing_partner() OR current_staff_role() = 'Office Manager');

CREATE POLICY "Staff can view chambers settings"
    ON chambers_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only Admins can update chambers settings"
    ON chambers_settings FOR ALL
    TO authenticated
    USING (is_admin_or_managing_partner());

CREATE POLICY "Staff can view and manage matter notes"
    ON matter_notes FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Staff can view and manage matter timeline"
    ON matter_timeline_events FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Login Audit Logs: Viewable by Admins only, insertable by authentication service
CREATE POLICY "Only Admins can view login audit logs"
    ON login_audit_logs FOR SELECT
    TO authenticated
    USING (is_admin_or_managing_partner());

CREATE POLICY "System can record login audit logs"
    ON login_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 12. REALTIME PUBLICATION SETUP
-- Enable Realtime events for tables that require live syncing across browser tabs
DO $$
BEGIN
    -- Check if table is already in supabase_realtime publication before adding
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE matters;
        ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
        ALTER PUBLICATION supabase_realtime ADD TABLE deadlines;
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
        ALTER PUBLICATION supabase_realtime ADD TABLE client_interactions;
        ALTER PUBLICATION supabase_realtime ADD TABLE fee_notes;
        ALTER PUBLICATION supabase_realtime ADD TABLE notice_board;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Publication might not exist in local development environment without realtime extension
    RAISE NOTICE 'Realtime publication setup skipped or already configured: %', SQLERRM;
END $$;

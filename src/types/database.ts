/**
 * Supabase Database Schema Definitions
 * Maps 1:1 with PostgreSQL tables in supabase/migrations/20260904000001_initial_schema.sql
 */

export interface Database {
  public: {
    Tables: {
      staff_users: {
        Row: {
          id: string;
          name: string;
          title: string;
          lsk_roll_no: string | null;
          avatar: string | null;
          email: string;
          phone: string | null;
          practice_area: string | null;
          active_cases_count: number;
          billable_hours_this_month: number;
          billing_rate_per_hour: number;
          role: string;
          status: string;
          joined_date: string | null;
          is_developer: boolean;
          is_system_admin: boolean;
          permissions: Record<string, any>;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['staff_users']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['staff_users']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          name: string;
          type: string;
          industry: string | null;
          kra_pin: string | null;
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          city: string;
          active_matters_count: number;
          total_billed_kes: number;
          retainer_status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      matters: {
        Row: {
          id: string;
          reference_number: string;
          title: string;
          client_name: string;
          client_id: string | null;
          practice_area: string;
          court_registry: string | null;
          court_case_number: string | null;
          cts_filing_id: string | null;
          responsible_advocate_id: string | null;
          responsible_advocate_name: string;
          status: string;
          next_deadline_date: string | null;
          next_deadline_description: string | null;
          next_court_date: string | null;
          court_date_purpose: string | null;
          estimated_fee_kes: number;
          fee_to_be_discussed_later: boolean;
          fee_notes: string | null;
          billed_kes: number;
          paid_kes: number;
          created_date: string;
          lodged_date: string | null;
          description: string | null;
          priority: string;
          documents_count: number;
          opposing_party: string | null;
          conflict_check_status: string;
          conflict_certificate_ref: string | null;
          tags: string[];
          archived_at: string | null;
          archived_by: string | null;
          archive_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['matters']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['matters']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          matter_id: string | null;
          matter_ref: string | null;
          client_name: string | null;
          assigned_to: string;
          created_by: string;
          priority: string;
          status: string;
          start_date: string | null;
          due_date: string;
          estimated_hours: number;
          actual_hours: number;
          subtasks: Array<{ id: string; text: string; completed: boolean }>;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      deadlines: {
        Row: {
          id: string;
          title: string;
          matter_id: string;
          matter_ref: string | null;
          matter_title: string;
          category: string;
          due_date: string;
          time: string;
          court_location: string | null;
          presiding_judge: string | null;
          advocate_name: string;
          priority: string;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['deadlines']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['deadlines']['Insert']>;
      };
      activities: {
        Row: {
          id: string;
          type: string;
          title: string;
          description: string | null;
          timestamp: string;
          user_name: string;
          matter_id: string | null;
          matter_ref: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['activities']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          title: string;
          message: string;
          timestamp: string;
          read: boolean;
          type: string;
          recipient_email: string | null;
          email_payload: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      fee_notes: {
        Row: {
          id: string;
          invoice_number: string;
          client_name: string;
          client_id: string | null;
          client_email: string | null;
          client_kra_pin: string | null;
          client_address: string | null;
          matter_id: string | null;
          matter_ref: string | null;
          matter_title: string;
          date_issued: string;
          due_date: string;
          items: any[];
          subtotal_kes: number;
          discount_kes: number;
          taxable_amount_kes: number;
          non_taxable_amount_kes: number;
          disbursements_kes: number;
          amount_kes: number;
          vat_rate_percent: number;
          vat_kes: number;
          total_kes: number;
          amount_paid_kes: number;
          balance_kes: number;
          status: string;
          payment_ref: string | null;
          quote_id: string | null;
          quote_number: string | null;
          notes: string | null;
          bank_details: string | null;
          payments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['fee_notes']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['fee_notes']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          receipt_number: string;
          payment_reference: string;
          invoice_id: string | null;
          invoice_number: string;
          client_id: string | null;
          client_name: string;
          matter_title: string | null;
          amount_kes: number;
          payment_method: string;
          payment_date: string;
          notes: string | null;
          received_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      quotations: {
        Row: {
          id: string;
          quote_number: string;
          title: string;
          client_id: string | null;
          client_name: string;
          client_email: string | null;
          client_phone: string | null;
          client_address: string | null;
          client_kra_pin: string | null;
          matter_id: string | null;
          matter_ref: string | null;
          matter_title: string | null;
          quote_date: string;
          expiry_date: string;
          items: any[];
          subtotal_kes: number;
          discount_percent: number;
          discount_kes: number;
          taxable_amount_kes: number;
          non_taxable_amount_kes: number;
          vat_kes: number;
          total_kes: number;
          status: string;
          notes: string | null;
          terms_and_conditions: string | null;
          converted_invoice_id: string | null;
          converted_invoice_number: string | null;
          converted_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quotations']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['quotations']['Insert']>;
      };
      document_folders: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          matter_ref: string | null;
          created_date: string;
          item_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['document_folders']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['document_folders']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          title: string;
          matter_ref: string;
          category: string;
          file_size: string;
          uploaded_by: string;
          uploaded_date: string;
          cts_receipt_no: string | null;
          current_version: string | null;
          versions: any[];
          folder_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      document_drafts: {
        Row: {
          id: string;
          title: string;
          matter_ref: string;
          folder_id: string | null;
          category: string;
          content: string;
          author: string;
          last_modified: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['document_drafts']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['document_drafts']['Insert']>;
      };
      client_onboardings: {
        Row: {
          id: string;
          client_name: string;
          client_type: string;
          id_or_reg_no: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          matter_type: string | null;
          assigned_advocate: string | null;
          retainer_fee_kes: number;
          status: string;
          submitted_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['client_onboardings']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['client_onboardings']['Insert']>;
      };
      leave_requests: {
        Row: {
          id: string;
          staff_name: string;
          role: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          days_requested: number;
          reason: string;
          relief_staff: string | null;
          status: string;
          requested_on: string;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['leave_requests']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['leave_requests']['Insert']>;
      };
      leave_balances: {
        Row: {
          staff_name: string;
          role: string;
          annual_total: number;
          annual_used: number;
          sick_total: number;
          sick_used: number;
          cle_total: number;
          cle_used: number;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['leave_balances']['Row'], 'updated_at'> & {
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['leave_balances']['Insert']>;
      };
      client_interactions: {
        Row: {
          id: string;
          interaction_type: string;
          subtype: string | null;
          date: string;
          time: string;
          duration_minutes: number | null;
          channel: string;
          direction: string;
          status: string;
          priority: string;
          is_confidential: boolean;
          client_id: string | null;
          client_name: string;
          is_existing_client: boolean;
          contact_person: string | null;
          phone_number: string | null;
          email: string | null;
          company_name: string | null;
          kra_pin: string | null;
          is_prospective_client: boolean;
          converted_to_client_id: string | null;
          converted_to_matter_id: string | null;
          matter_id: string | null;
          matter_ref: string | null;
          matter_title: string | null;
          handled_by_id: string | null;
          handled_by_name: string;
          assigned_staff_id: string | null;
          assigned_staff_name: string | null;
          subject: string;
          description: string;
          client_request_or_enquiry: string | null;
          response_provided: string | null;
          outcome: string | null;
          action_required: string | null;
          internal_notes: string | null;
          follow_up_required: boolean;
          follow_up_assigned_to_id: string | null;
          follow_up_assigned_to_name: string | null;
          follow_up_due_date: string | null;
          follow_up_status: string | null;
          follow_up_notes: string | null;
          follow_up_completed_date: string | null;
          linked_task_id: string | null;
          enquiry_category: string | null;
          enquiry_source: string | null;
          enquiry_status: string | null;
          enquiry_deadline: string | null;
          enquiry_resolution: string | null;
          complaint_category: string | null;
          complaint_severity: string | null;
          complaint_status: string | null;
          complaint_investigation_notes: string | null;
          complaint_resolution: string | null;
          complaint_date_resolved: string | null;
          client_satisfaction: string | null;
          visitor_pass_number: string | null;
          visitor_id_number: string | null;
          check_in_time: string | null;
          check_out_time: string | null;
          host_advocate_name: string | null;
          attachments: any[];
          created_by: string;
          created_date: string;
          last_modified_by: string | null;
          last_modified_date: string | null;
          audit_trail: any[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['client_interactions']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['client_interactions']['Insert']>;
      };
      notice_board: {
        Row: {
          id: string;
          title: string;
          category: string;
          content: string;
          posted_by: string;
          posted_role: string | null;
          date: string;
          priority: string;
          pinned: boolean;
          target_audience: string | null;
          event_date: string | null;
          location: string | null;
          acknowledged_by: string[];
          reactions: any[];
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notice_board']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notice_board']['Insert']>;
      };
      chambers_settings: {
        Row: {
          id: string;
          firm_name: string;
          tagline: string | null;
          logo_url: string | null;
          lsk_firm_reg_no: string | null;
          kra_pin: string | null;
          physical_address: string | null;
          postal_address: string | null;
          phone: string | null;
          email: string | null;
          billing_email: string | null;
          website: string | null;
          managing_partner: string | null;
          bank_details: Record<string, any>;
          integrations: Record<string, any>;
          compliance: Record<string, any>;
          display_preferences: Record<string, any>;
          last_saved: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chambers_settings']['Row'], 'updated_at'> & {
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['chambers_settings']['Insert']>;
      };
    };
  };
}

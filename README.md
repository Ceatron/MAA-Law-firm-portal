# Muthoni Ahago Advocates Web Portal

Full-featured Chambers Management and Client Portal for Muthoni Ahago Advocates, featuring legal matter tracking, court deadline diary, fee notes and invoicing, HRM leave management, document vault, and intelligent legal assistance.

---

## Environment Configuration

The application requires specific environment variables for backend AI operations and cloud database synchronization.

### 1. Setting Up Your `.env` File

Copy the template from `.env.example` into a local `.env` file at the root of the project:

```bash
cp .env.example .env
```

Open `.env` and configure the required values:

```env
# ------------------------------------------------------------------------------
# Gemini AI Configuration (Server-Side Only)
# ------------------------------------------------------------------------------
GEMINI_API_KEY=your_gemini_api_key_here

# ------------------------------------------------------------------------------
# Supabase Frontend Configuration (Safe for Browser)
# ------------------------------------------------------------------------------
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here

# ------------------------------------------------------------------------------
# Supabase Admin Configuration (Strictly Server-Side Only)
# ------------------------------------------------------------------------------
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## Supabase Key Architecture & Security Directives

### Frontend Credentials (`VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`)
- **Must be declared in your `.env` file**.
- In Vite applications, variables prefixed with `VITE_` are bundled into the client build and accessible in browser code via `import.meta.env`.
- **`VITE_SUPABASE_URL`**: Your project's unique HTTPS API gateway.
- **`VITE_SUPABASE_ANON_KEY`**: The public, anonymous API token. It is **safe for browser use** because every database query and mutation is strictly enforced by Supabase **Row Level Security (RLS)** policies.
- Client services (including `SupabaseMigrationService` and `supabaseClient`) only consume `VITE_SUPABASE_ANON_KEY`.

### Administrative Service-Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
> ⚠️ **CRITICAL SECURITY RULE**: 
> The **service-role key must remain exclusively on the server-side and NEVER be used in any frontend service.**

1. **Superuser Privileges**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses **ALL** Row Level Security (RLS) rules and provides unrestricted, full-access reads and writes across every table in the database.
2. **Never Prefix with `VITE_`**: Do not add `VITE_` to the service-role key variable name. Any variable prefixed with `VITE_` will be embedded directly into publicly readable browser JavaScript bundles.
3. **No Frontend Imports**: Never import, reference, or pass `SUPABASE_SERVICE_ROLE_KEY` in React components, frontend services, hooks, or client utilities.
4. **Permitted Usage**: The service-role key is intended solely for trusted, server-side environments such as background cron workers, Node.js scripts, or secured Express `/api/*` routes.

# System & Developer Directives for Muthoni & Ahago Advocates Chambers System

## CRITICAL: Production Data Integrity Rule
This application is connected to real company data.

1. **NO Mock / Demo / Test Data**:
   - NEVER create, insert, seed, fabricate, generate, or display mock/demo/test company data.
   - NEVER add hardcoded example companies, employees, customers, transactions, records, or other business data.
   - All data displayed by the application must come from the existing production database/API/storage.

2. **When Developing or Testing**:
   - Use existing real data only.
   - If there is insufficient real data to demonstrate a feature, show a clean empty state.
   - Do NOT create fake records to make the UI look populated.
   - Do NOT modify the production database merely to demonstrate a feature.
   - Do NOT create database seed scripts unless explicitly requested by the user.
   - Do NOT add fallback mock data (e.g. falling back to mock lists when database returns empty).
   - Do NOT use localStorage as a substitute for the production database.
   - Do NOT merge mock data with production data.

3. **Missing Data Protocol**:
   - If a feature requires data that does not currently exist, stop and explain what data is required rather than inventing it.
   - Before implementing a feature, inspect the existing data model, database connection, API calls, and data-loading functions and reuse them.
   - Production data has absolute priority over demonstration data at all times.

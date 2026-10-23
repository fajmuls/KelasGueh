# Implementation Plan: Supabase Realtime Integration, bcryptjs PIN Security, Monthly Checklist & Responsive UI

Comprehensive overhaul to establish a true, 100% active Supabase PostgreSQL integration with Realtime broadcast, implement standard `bcryptjs` PIN hashing for high-value transactions, convert the Checklist view to a Month-based 4-Week structure with date ranges, fix the Audit Log user attribution bug, and enforce zero-horizontal-overflow responsive UI across mobile and desktop.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural choices have been confirmed based on user feedback:

- **Confirmed Decision 1 (Database & Persistence)**: Supabase PostgreSQL as primary database with live URL & Anon Key integration, automated DDL table initializations (`kas_transactions`, `kas_members`, `class_settings`, `audit_logs`), and Supabase Realtime broadcast.
- **Confirmed Decision 2 (PIN Security)**: `bcryptjs` cryptographic library for transaction PIN hashing and verification before saving transactions >= Rp 500,000.
- **Confirmed Decision 3 (Checklist Structure)**: Monthly Mode (4 Weeks per month) with Month Picker (e.g., Oktober 2026, November 2026) and specific date ranges per week.

---

## 1. Overview & Core Concept

1. **True Supabase Integration & DDL Verification**:
   - Verify and activate Supabase client initialization in `src/services/supabaseClient.ts`.
   - Provide real connection diagnostic checks in `KasSettings.tsx` that actually query and create missing tables if needed.
2. **bcryptjs PIN Verification for High-Value Transactions**:
   - Install `bcryptjs` and `@types/bcryptjs`.
   - Hash PINs with standard `bcryptjs.hashSync` (salt factor 10) and verify via `bcryptjs.compareSync` before saving transactions >= Rp 500,000.
3. **Monthly Checklist Iuran (4 Weeks per Month)**:
   - Transition from 8 arbitrary weeks (`M1`..`M8`) to a monthly selector layout (`Bulan Oktober 2026`, etc.).
   - Each month has 4 clean weeks (`Minggu 1: 1-7 Oct`, `Minggu 2: 8-14 Oct`, `Minggu 3: 15-21 Oct`, `Minggu 4: 22-28 Oct`).
4. **Audit Log Attribution Bug Fix**:
   - Dynamically pass actual logged-in user credentials (`user.name`, `user.email`, `role`) into `LocalKasRepository.addAuditLog` across all actions (member import, transaction add/delete, dues check) so Super Admin actions are attributed to Super Admin, not hardcoded as "Bendahara".
5. **Zero-Horizontal-Overflow Responsive UI**:
   - Apply `max-w-full overflow-x-hidden` on global layout containers.
   - Ensure all tables wrap cleanly or scroll inside isolated containers without overflowing the window width on mobile or desktop.
   - Adjust icon sizes and touch target padding for mobile devices.

---

## 2. User Experience & Visual Design

- **Viewport & Responsive Layout**:
  - Main container uses `w-full max-w-7xl mx-auto px-3 sm:px-6 overflow-x-hidden`.
  - Navbar, Topbar, and Footer adjust touch targets ($\ge 44\text{px}$) and icon scales (`w-4 h-4` on mobile).
- **Checklist Month Picker & Calendar Context**:
  - Month Selector dropdown / tab strip at the top of Checklist view (e.g., `Januari 2026` ... `Desember 2026`).
  - 4 weekly check columns with specific dates displayed in column headers.
  - Clear summary of monthly dues lunas vs arrears.
- **PIN Verification Modal**:
  - Displays high-value transaction details (amount, description, date).
  - 6-digit numeric input field with bcrypt comparison feedback.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Install `bcryptjs` for Standard Cryptographic Hashing**:
  - *Chosen Approach*: Use `bcryptjs` for standard bcrypt hashing and verification.
  - *Why*: User explicitly requested standard bcrypt hashing for PIN security.
- **Decision 2: Month-Based Dues Data Model**:
  - *Chosen Approach*: Store weekly dues status keyed by `year_month_week` (e.g. `2026_10_W1`, `2026_10_W2`).
  - *Why*: Provides clean historical tracking month-by-month without infinite horizontal week scrolling.
- **Decision 3: Dynamic Auth User Context in Audit Logs**:
  - *Chosen Approach*: Retrieve active user identity from `AuthContext` on every action.
  - *Why*: Eliminates false attribution in multi-user audit logs.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                             React UI App                               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  KasOverview │  │   KasBook    │  │KasChecklist │  │ KasSettings │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘  │
└─────────┼─────────────────┼─────────────────┼───────────────┼──────────┘
          │                 │                 │               │
          ▼                 ▼                 ▼               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      LocalKasRepository & AuthContext                  │
│  - bcryptjs PIN Verification (Transactions >= Rp 500k)                │
│  - Real Active User Audit Logging (user.name + role)                   │
│  - Month-based Weekly Dues State (Year-Month-W1..W4)                   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ (Supabase JS Client + Realtime)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Supabase PostgreSQL                            │
│  - kas_transactions (id, type, amount, category, description, date)    │
│  - kas_members (id, name, student_id, phone, monthly_weekly_status)    │
│  - class_settings (id, class_name, target_amount, weekly_dues_amount)  │
│  - audit_logs (id, action, details, performed_by, user_role, timestamp)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## Proposed File Changes

1. **`package.json`**:
   - Add `bcryptjs` and `@types/bcryptjs`.
2. **`src/utils/security.ts`**:
   - Implement bcryptjs PIN hashing and comparison utilities (`hashPinBcrypt`, `verifyPinBcrypt`).
3. **`src/services/supabaseClient.ts`**:
   - Update `AuditLogEntry` and `LocalKasRepository` to support dynamic user details and month-based weekly dues keying (`YYYY_MM_W1..W4`).
4. **`src/components/Doodle/KasChecklist.tsx`**:
   - Add Month Selector (Jan-Dec) and render 4 Weeks per month with date ranges.
   - Use dynamic logged-in user name for audit log entries.
5. **`src/components/Doodle/KasBook.tsx` & `PinVerificationModal.tsx`**:
   - Integrate `bcryptjs` PIN check before saving expenses >= Rp 500,000.
6. **`src/components/Doodle/KasSettings.tsx`**:
   - Update Supabase connection test to perform real query verification and offer 1-click table setup check.
7. **`src/types/kas.ts`**:
   - Update types for month-based weekly dues and audit log user fields.
8. **`src/version.ts`**:
   - Bump version to `v3.1.0` with full changelog and proactive suggestions.

---

## Verification Plan

1. **Lint & Build**:
   - Run `lint_applet` and `compile_applet` to ensure zero TypeScript or syntax errors.
2. **Functional Test**:
   - Test PIN verification using `bcryptjs` for transactions >= Rp 500,000.
   - Verify Checklist month selector switching and 4-week status toggling.
   - Verify Audit Log correctly records Super Admin vs Bendahara identity.
   - Test UI responsively on small screen sizes to ensure no horizontal scrollbars occur.

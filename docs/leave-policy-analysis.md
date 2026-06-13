# Leave Policy Page — Detailed Analysis

**File:** `src/app/admin-dashboard/leave-policy/page.tsx` (~1860 lines)  
**Related:** `src/lib/adminLeavePolicies.ts`, `src/lib/leaveValidation.ts`, `src/lib/employeeLeave.ts`  
**Last reviewed:** June 2026

---

## Overview

The Leave Policy admin page is a full-featured CRUD interface for managing leave types, quotas, and organization-level settings. Policies are stored in `admin_leave_policies`; org settings in `admin_leave_org_settings`. Employee leave apply flow reads these tables via `leaveValidation.ts` and `employeeLeave.ts`.

---

## What Is Implemented

### 1. Dashboard stats

- Total policies
- Active policies
- Annual quota sum (active policies with accrual ≠ `none`)
- Paid leave types count

### 2. Organization settings

| Setting | Purpose |
|---------|---------|
| Fiscal year start month | Default: April (`4`) |
| Default min notice (days) | Fallback when policy notice = 0 |
| Default max consecutive days | Saved but **not used in validation** (see gaps) |
| Allow half-day globally | Enforced in leave validation |
| Count weekends in leave duration | Enforced in day counting |
| Notification emails | Up to 30 addresses; emailed on new leave application |

### 3. Leave policy CRUD

Each policy supports:

| Category | Fields |
|----------|--------|
| **Basic** | Code (max 8), name, description, active |
| **Quota** | Days/year, accrual (`yearly` / `monthly` / `none`) |
| **Rules** | Min notice, max consecutive, carry forward (enabled + max days) |
| **Eligibility** | Applicable months (or all months), months after joining |
| **Per-request limits** | Max/min days per request, max advance booking days |
| **Frequency limits** | Max requests/month, max requests/year, min gap between requests |
| **Balance rules** | Enforce remaining balance cap, use full balance when low (+ threshold) |
| **Flags** | Half-day, document required, manager approval, paid, weekdays only, backdated leave |

### 4. UI actions

- Search by name, code, or description
- Add / Edit / View (read-only) modal
- Active / Inactive toggle (inline, no full form)
- Delete (with `window.confirm`)
- Client-side + API validation on save

### 5. API routes

| Method | Route |
|--------|-------|
| `GET` / `POST` | `/api/admin/leave-policies` |
| `PUT` / `DELETE` | `/api/admin/leave-policies/[id]` |
| `GET` / `PUT` | `/api/admin/leave-policies/settings` |

---

## Major Gaps — Configured in UI but Not Fully Wired

### 1. Monthly accrual is UI-only

The form offers **“Monthly accrual”**, but balance calculation always uses the full `days_per_year`:

```ts
// src/app/api/employee/leave/route.ts
const total =
    policy.accrual_cycle === "none" ? 0 : Number(policy.days_per_year) || 0;
```

No pro-rata for mid-year joiners either.

### 2. Carry forward is not applied

`carry_forward_enabled` and `carry_forward_max` are stored in DB but never used in FY rollover or balance logic. Employees always see `days_per_year - used`.

### 3. `max_consecutive_days_default` is unused

Org setting is saved from the admin page but `leaveValidation.ts` only checks per-policy `max_consecutive_days`. Unlike `default_min_notice_days`, this default never acts as a fallback.

### 4. `requires_approval` has no workflow effect

Flag is saved and shown as a hint on the employee UI. All requests still go through **pending → L1 → L2**. Setting `requires_approval = false` does not auto-approve.

### 5. Balance bug — `l1_approved` not counted as used

Used days query only includes `pending` and `approved`:

```ts
// src/lib/employeeLeave.ts
AND status IN ('pending', 'approved')
```

After L1 approval, an employee can apply again and over-use balance.

### 6. Document required — filename only

Employee file picker stores **only the file name** (`attachment_name`). The file is not uploaded. Admin cannot view the actual document on leave-request page.

### 7. No per-employee / department policy assignment

All **active** policies are visible to every employee. No mapping by department, role, or individual.

---

## Security & Data Integrity

| Issue | Detail |
|-------|--------|
| **Missing admin auth** | `leave-policies` API routes do not call `getAdminSession()` (unlike e.g. `work-entries`, `tasks`) |
| **Unsafe delete** | Policy can be deleted without checking existing `employee_leave_requests` |
| **Editable policy code** | Code can change on edit; historical requests keep old `policy_code` snapshot |

---

## UX / UI Gaps

| Gap | Detail |
|-----|--------|
| No empty state | Zero policies shows empty table; no “Add first policy” or default templates (CL, SL, EL) |
| No mobile layout | Policy list is desktop table only |
| Weak error UX | `loadError` is small text; no Retry; delete/errors use `alert` / `confirm` |
| Limited filters | Text search only — no active/inactive, paid, accrual filters |
| No cross-link | No link to `/admin-dashboard/leave-request` or per-policy usage stats |
| No audit trail | `created_at` / `updated_at` not shown; no change history |
| Monolithic file | ~1860 lines in one file (types, mappers, UI, modals) |
| No clone / export | Cannot duplicate a policy or import/export policies |

---

## Org Settings — What Actually Affects Runtime

| Setting | Used at runtime? |
|---------|------------------|
| Fiscal year start | Yes — used days counted from FY start |
| Default min notice | Yes — when policy `min_notice_days` is 0 |
| Default max consecutive | **No** |
| Allow half-day globally | Yes |
| Count weekends in leave | Yes |
| Notification emails | Yes — on **new application** only (not approve/reject) |

---

## Validation & HR Rules Not Covered

- Public holiday calendar
- Sandwich leave rules
- Overlapping leave requests (same dates)
- Gender / role-specific leave types (e.g. maternity)
- Paid vs unpaid linked to payroll

---

## Architecture (simplified)

```
Leave Policy Page
    ├── admin_leave_policies (DB)
    └── admin_leave_org_settings (DB)
            │
            ▼
    Employee Leave Apply
            ├── leaveValidation.ts
            └── Balance = days_per_year - used

    carry_forward      ──► NOT wired to balance
    monthly accrual    ──► NOT wired to balance
    max_consecutive_default ──► NOT wired to validation
```

---

## Priority Recommendations

### High (functional bugs)

1. Include `l1_approved` in used balance calculation
2. Implement monthly accrual + carry forward, or remove/hide from UI until ready
3. Add `getAdminSession()` to all leave-policy API routes
4. Block or warn on policy delete when linked leave requests exist

### Medium (HR expectations)

5. Employee / department-wise policy assignment
6. Real file upload for `document_required`
7. `requires_approval = false` → auto-approve behaviour
8. Seed default policies (CL, SL, EL) on first setup
9. Pro-rata balance for new joiners

### Low (polish)

10. Mobile cards, filters, empty state, retry on load error
11. Policy clone, usage stats, link to leave requests
12. Split page into smaller components / shared types in `lib`

---

## Key File References

| Area | Path |
|------|------|
| Admin page | `src/app/admin-dashboard/leave-policy/page.tsx` |
| DB + parsers | `src/lib/adminLeavePolicies.ts` |
| Leave validation | `src/lib/leaveValidation.ts` |
| Employee leave + balance | `src/lib/employeeLeave.ts` |
| Employee leave API | `src/app/api/employee/leave/route.ts` |
| Admin policies API | `src/app/api/admin/leave-policies/route.ts` |
| Admin settings API | `src/app/api/admin/leave-policies/settings/route.ts` |
| Leave requests (admin) | `src/app/admin-dashboard/leave-request/page.tsx` |
| Leave apply (employee) | `src/app/employee-dashboard/leave/page.tsx` |

---

## Summary

The page **looks complete** on the surface — most HR policy fields exist in UI and database. The main gaps are:

- Several advanced rules are **stored but not enforced** (monthly accrual, carry forward, org default max consecutive, approval bypass)
- **Balance logic has a real bug** (`l1_approved` excluded from used days)
- **Document upload** is name-only
- **All employees** see all active policies
- **API auth** may be missing on admin leave-policy routes

Overall: strong admin configuration UI; backend/runtime behaviour needs alignment with what the form promises.

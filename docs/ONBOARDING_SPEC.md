# Employee Onboarding Flow Specification — HRMS

**Version:** 1.0  
**Applies to:** Fresher and Switching/Experienced employees  
**Last updated:** 2026-02

---

## 1. ONBOARDING STAGES

| Stage | Name | Description | Fresher | Switching |
|-------|------|-------------|---------|-----------|
| 1 | Offer Acceptance | Candidate accepts offer; onboarding record created | ✓ | ✓ |
| 2 | Personal Information Collection | Name, DOB, gender, address, contact | ✓ | ✓ |
| 3 | Document Upload | ID, address proof, photos, experience docs | ✓ | ✓ |
| 4 | Bank Details | Account number, IFSC, bank name for salary | ✓ | ✓ |
| 5 | Emergency Contact | Primary and secondary emergency contacts | ✓ | ✓ |
| 6 | Education Details | Degrees, institutions, marks, year | ✓ (more fields) | ✓ (reduced) |
| 7 | Experience Details | Previous companies, designation, duration, salary | — | ✓ only |
| 8 | ID Generation | Employee ID assigned (EMP-YYYY-DEPT-NNN) | ✓ | ✓ |
| 9 | IT Setup | Email, system access, licenses, hardware | ✓ | ✓ |
| 10 | HR Review & Activation | Final verification, profile activation | ✓ | ✓ |

**Flow order:** 1 → 2 → 3 → 4 → 5 → 6 → [7 if switching] → 8 → 9 → 10.

---

## 2. DATA COLLECTION TABLES

### A. Personal Information (Common for both)

| Field name | Data type | Required? | Notes |
|------------|-----------|-----------|--------|
| `firstName` | string(100) | Yes | Legal first name |
| `lastName` | string(100) | Yes | Legal last name |
| `middleName` | string(100) | No | If applicable |
| `dateOfBirth` | date | Yes | DD/MM/YYYY |
| `gender` | enum | Yes | Male / Female / Other / Prefer not to say |
| `maritalStatus` | enum | No | Single / Married / Divorced / Widowed |
| `nationality` | string(100) | Yes | As in passport/ID |
| `bloodGroup` | string(10) | No | A+, B+, O+, etc. |
| `personalEmail` | email | Yes | Non-work email |
| `personalMobile` | string(20) | Yes | With country code |
| `alternateMobile` | string(20) | No | Secondary contact |
| `currentAddress` | text | Yes | Full address |
| `currentCity` | string(100) | Yes | |
| `currentState` | string(100) | Yes | |
| `currentPincode` | string(20) | Yes | |
| `currentCountry` | string(100) | Yes | |
| `permanentAddress` | text | Yes | Same as current if same |
| `permanentCity` | string(100) | Yes | |
| `permanentState` | string(100) | Yes | |
| `permanentPincode` | string(20) | Yes | |
| `permanentCountry` | string(100) | Yes | |
| `isSameAsCurrent` | boolean | No | If true, permanent = current |
| `panNumber` | string(20) | Yes | For India; optional elsewhere |
| `aadhaarNumber` | string(20) | No | For India; optional elsewhere |
| `passportNumber` | string(50) | No | If applicable |
| `employeeType` | enum | Yes | FRESHER / SWITCHING (set at offer) |

---

### B. Contact Details (Common for both)

| Field name | Data type | Required? | Notes |
|------------|-----------|-----------|--------|
| `primaryPhone` | string(20) | Yes | Same as personalMobile |
| `secondaryPhone` | string(20) | No | |
| `personalEmail` | email | Yes | Duplicated from Personal Info for contact view |
| `emergencyContactPrimary` | object | Yes | See section G |
| `emergencyContactSecondary` | object | No | See section G |

*Contact details are captured in Stage 2 (Personal) and Stage 5 (Emergency); this table is the consolidated view.*

---

### C. Identity Documents (Common for both)

| Document name | Field/key | Required? | Notes |
|---------------|-----------|-----------|--------|
| Photo | `photo` | Yes | Passport-size; recent |
| Identity proof | `identityProof` | Yes | Aadhaar / Passport / Voter ID / Driving Licence |
| Address proof | `addressProof` | Yes | Utility bill / Aadhaar / Rent agreement (within 3 months) |
| PAN card | `panCard` | Yes | For India |
| Passport | `passport` | No | If holding passport |
| Resume/CV | `resume` | Yes | Latest version |
| Offer letter (signed) | `signedOfferLetter` | Yes | Signed copy uploaded by candidate |

All stored with: `documentType`, `fileUrl`, `fileName`, `uploadedAt`, `verifiedAt`, `verifiedBy`, `verificationStatus`, `rejectionReason`.

---

### D. Education Details — Fresher vs Switching

| Field | Fresher | Switching | Notes |
|-------|---------|-----------|--------|
| Highest qualification | Required | Required | Degree/Diploma name |
| Institution name | Required | Required | |
| University/Board | Required | Required | |
| Year of passing | Required | Required | |
| Percentage/CGPA | Required | Optional | Fresher: mandatory for verification |
| Division/Class | Required | Optional | First/Second/Third |
| Specialization | Required | Optional | Branch/Stream |
| Start date (course) | Required | Optional | |
| End date (course) | Required | Optional | |
| Marksheet/Transcript upload | Required | Optional | Fresher: mandatory |
| Degree certificate upload | Required | Optional | Fresher: mandatory |
| Class 10 details | Required | Optional | Fresher: often required |
| Class 12 details | Required | Optional | Fresher: often required |
| Number of education entries | Multiple (10, 12, grad, PG) | Usually 1 (highest) | Fresher: 10th, 12th, graduation (and PG if any) |

**Education table fields (full list):**

| Field name | Data type | Required (Fresher) | Required (Switching) |
|------------|-----------|---------------------|------------------------|
| `qualification` | string(100) | Yes | Yes |
| `institution` | string(200) | Yes | Yes |
| `universityBoard` | string(200) | Yes | Yes |
| `yearOfPassing` | integer | Yes | Yes |
| `percentageOrCgpa` | string(20) | Yes | No |
| `divisionOrClass` | enum | Yes | No |
| `specialization` | string(100) | Yes | No |
| `startDate` | date | Yes | No |
| `endDate` | date | Yes | No |
| `marksheetDocumentId` | FK document | Yes | No |
| `degreeCertificateDocumentId` | FK document | Yes | No |

---

### E. Experience Details (Only for Switching)

| Field name | Data type | Required? | Notes |
|------------|-----------|-----------|--------|
| `companyName` | string(200) | Yes | Legal name of employer |
| `designation` | string(100) | Yes | Job title |
| `employmentType` | enum | Yes | Full-time / Part-time / Contract / Internship |
| `startDate` | date | Yes | |
| `endDate` | date | Yes | Last working day |
| `isCurrent` | boolean | No | If still employed (notice period) |
| `reasonForLeaving` | string(500) | No | Brief reason |
| `lastDrawnSalary` | decimal | No | Can be optional; some orgs require |
| `lastDrawnSalaryCurrency` | string(10) | No | INR / USD etc. |
| `reportingManagerName` | string(100) | No | |
| `reportingManagerContact` | string(50) | No | For reference |
| `experienceLetterDocumentId` | FK document | Yes | Relieving/Experience letter |
| `salarySlipDocumentId` | FK document | No | Last 3 months often asked |
| `offerLetterDocumentId` | FK document | No | Previous offer (optional) |

**Documents needed (Switching):**

- Relieving letter / Experience letter (mandatory)
- Last 3 months’ salary slips (optional but recommended)
- Previous offer letter (optional)

Multiple rows per candidate (one per previous company). Order: most recent first.

---

### F. Bank Details (Common for both)

| Field name | Data type | Required? | Notes |
|------------|-----------|-----------|--------|
| `accountHolderName` | string(200) | Yes | As per bank record |
| `bankName` | string(200) | Yes | |
| `branchName` | string(200) | No | |
| `branchAddress` | text | No | |
| `accountNumber` | string(50) | Yes | Encrypt at rest |
| `confirmAccountNumber` | string(50) | Yes | UI only; not stored |
| `ifscCode` | string(20) | Yes | India; 11 chars |
| `accountType` | enum | Yes | Savings / Current |
| `panLinkedToAccount` | string(20) | No | PAN if different from profile |
| `cancelChequeDocumentId` | FK document | Yes | Cancelled cheque or bank proof |

---

### G. Emergency Contact (Common for both)

| Field name | Data type | Required? | Notes |
|------------|-----------|-----------|--------|
| `contactName` | string(100) | Yes | Full name |
| `relationship` | enum/string | Yes | Spouse / Parent / Sibling / Friend / Other |
| `phone` | string(20) | Yes | Primary contact number |
| `alternatePhone` | string(20) | No | |
| `email` | email | No | |
| `address` | text | No | Optional full address |
| `isPrimary` | boolean | Yes | One primary per candidate |

Two records: one primary (required), one secondary (optional). Same structure for both.

---

## 3. DOCUMENT UPLOAD CHECKLIST

| Document name | Fresher | Switching | Both | Format | Max size | Verified by |
|---------------|---------|-----------|------|--------|----------|-------------|
| Passport-size photo | ✓ | ✓ | — | JPG, PNG | 2 MB | HR |
| Identity proof (Aadhaar/Passport/Voter ID/Driving Licence) | ✓ | ✓ | — | PDF, JPG, PNG | 5 MB | HR |
| Address proof | ✓ | ✓ | — | PDF, JPG, PNG | 5 MB | HR |
| PAN card | ✓ | ✓ | — | PDF, JPG, PNG | 2 MB | HR |
| Passport (if applicable) | ✓ | ✓ | — | PDF, JPG, PNG | 5 MB | HR |
| Resume/CV | ✓ | ✓ | — | PDF | 5 MB | HR |
| Signed offer letter | ✓ | ✓ | — | PDF | 5 MB | HR/Admin |
| Class 10 marksheet | ✓ | — | — | PDF, JPG, PNG | 5 MB | HR |
| Class 12 marksheet | ✓ | — | — | PDF, JPG, PNG | 5 MB | HR |
| Graduation marksheet/transcript | ✓ | Optional | — | PDF, JPG, PNG | 5 MB | HR |
| Degree certificate | ✓ | Optional | — | PDF, JPG, PNG | 5 MB | HR |
| Relieving / Experience letter | — | ✓ | — | PDF | 5 MB | HR |
| Last 3 months’ salary slips | — | ✓ | — | PDF | 5 MB | HR |
| Cancelled cheque / Bank proof | ✓ | ✓ | — | PDF, JPG, PNG | 2 MB | HR/Admin |

**Rules:**

- Allowed formats: PDF, JPG, PNG unless stated. No editable formats (DOC/XLS) for official docs.
- Max size enforced at upload; show clear error if exceeded.
- Verified by: HR for most; Admin for offer letter and bank proof if policy differs.

---

## 4. CONDITIONAL LOGIC

### Fields only for Fresher

- Education: Class 10 and Class 12 details (all fields).
- Education: Percentage/CGPA, Division/Class, Specialization, Start/End dates.
- Education: Marksheet and degree certificate upload (mandatory).
- Multiple education entries (10th, 12th, graduation, PG).

### Fields only for Switching

- Entire **Experience Details** section (Stage 7).
- Experience: company name, designation, duration, last salary, documents (relieving letter, salary slips).
- Education: only highest qualification; marksheet/certificate upload optional.

### Mandatory for both

- Personal Information (all required fields in table A).
- Contact details (primary phone, personal email).
- Document upload: Photo, Identity proof, Address proof, PAN, Resume, Signed offer letter, Cancelled cheque.
- Bank details (all required fields in table F).
- Emergency contact (at least one primary).
- Education: at least highest qualification (institution, university, year).

### Summary matrix

| Section / Field group | Fresher | Switching |
|----------------------|---------|-----------|
| Personal info | All required | All required |
| Documents (common) | All common docs | All common docs |
| Education (full) | Required (10th, 12th, grad, PG) | Only highest; fewer fields |
| Education (marksheet/certificate) | Required | Optional |
| Experience | Hidden | Required (Stage 7) |
| Bank & Emergency | Required | Required |

---

## 5. ONBOARDING STATUS TRACKING

| Status code | Display name | Description | Next possible statuses |
|-------------|--------------|-------------|-------------------------|
| `OFFER_ACCEPTED` | Offer Accepted | Offer accepted; onboarding started | DOCUMENTS_PENDING |
| `DOCUMENTS_PENDING` | Documents Pending | Awaiting upload/verification | DOCUMENTS_VERIFIED, DOCUMENT_REJECTED |
| `DOCUMENT_REJECTED` | Document Rejected | One or more docs rejected; re-upload required | DOCUMENTS_PENDING |
| `DOCUMENTS_VERIFIED` | Documents Verified | All docs verified by HR | IT_SETUP_PENDING |
| `IT_SETUP_PENDING` | IT Setup Pending | Waiting for IT provisioning | IT_SETUP_COMPLETED |
| `IT_SETUP_COMPLETED` | IT Setup Completed | Email, access, etc. done | HR_REVIEW_PENDING |
| `HR_REVIEW_PENDING` | HR Review Pending | Final HR check before activation | ACTIVE, DOCUMENT_REJECTED |
| `ACTIVE` | Active | Employee activated; can log in and use system | — |

**State machine (simplified):**

- Offer Accepted → Documents Pending → Documents Verified → IT Setup Pending → IT Setup Completed → HR Review Pending → Active.
- From Documents Pending or HR Review Pending → Document Rejected → back to Documents Pending after re-upload.

---

## 6. VERIFICATION PROCESS

### How HR verifies documents

1. HR sees list of uploaded documents in “Onboarding → Pending verification”.
2. For each document, HR opens file and checks:
   - Correct document type (e.g. Aadhaar vs Passport).
   - Name/DOB/address match with application.
   - Not expired (e.g. passport, licence).
   - Clear and readable; not cropped or tampered.
3. HR marks each as **Verified** or **Rejected** with a reason.

### If document is rejected

1. Status can move to `DOCUMENT_REJECTED` (or stay `DOCUMENTS_PENDING` with rejection reason on item).
2. Candidate sees rejection reason and which document to re-upload.
3. Re-upload replaces the previous file for that slot; version can be stored for audit.
4. After re-upload, document goes back to “Pending verification”; status can remain or go back to `DOCUMENTS_PENDING`.

### Re-upload process

1. Candidate gets notification: “Document X was rejected: [reason].”
2. In onboarding portal, rejected item shows “Re-upload” with same format/size rules.
3. New file is stored; previous file retained (soft delete or version flag).
4. HR sees “Pending verification” again for that document.
5. When all are verified, status moves to `DOCUMENTS_VERIFIED`.

### Approval workflow

- Single-level: one HR verifier per document (configurable).
- Optional: “Second-level approval” for critical docs (e.g. bank, offer) — same flow with an extra “Approved by” step and status.

---

## 7. EMPLOYEE ID GENERATION

**Format:** `EMP-{YYYY}-{DEPT}-{SEQ}`

| Part | Source | Example |
|------|--------|--------|
| Prefix | Fixed `EMP` | EMP |
| Year | Year of joining (from offer/DOJ) | 2026 |
| Department | Short code (e.g. from department master) | IT, HR, ENG, OPS |
| Sequence | 3-digit zero-padded sequence per department per year | 001, 002, … 999 |

**Examples:**

- `EMP-2026-IT-001` — First IT joinee in 2026.
- `EMP-2026-HR-003` — Third HR joinee in 2026.

**Rules:**

- Sequence resets per department per calendar year.
- Assign at Stage 8 (ID Generation) after documents are verified (or after HR confirms DOJ).
- Store in `employees.employeeCode` or equivalent; use for login, payroll, and display.

---

## 8. IT PROVISIONING LIST

| Item | Description | Owner | When |
|------|-------------|--------|------|
| Email account | Official email (e.g. firstname.lastname@company.com) | IT | Stage 9 |
| Domain/AD account | Windows/Google/Microsoft 365 login | IT | Stage 9 |
| System access | Laptop/desktop allocation or VM | IT | Stage 9 |
| VPN access | If applicable | IT | Stage 9 |
| Software licenses | MS Office, IDE, tools as per role | IT | Stage 9 |
| HRMS/Portal access | Employee self-service login (after activation) | IT/HR | Stage 10 |
| Hardware allocation | Asset ID, serial number recorded in Assets module | IT/Admin | Stage 9 |
| Phone/extension | If applicable | IT | Stage 9 |

**Data to capture:** Email created (Y/N), System assigned (Y/N), Asset ID, License list, Date provisioned. Optional: integration with IT ticketing for automation.

---

## 9. ONBOARDING CHECKLIST FOR HR

| # | Task | Stage | Owner | Done when |
|---|------|-------|--------|-----------|
| 1 | Verify identity document | 3 | HR | Document marked Verified |
| 2 | Verify address proof | 3 | HR | Document marked Verified |
| 3 | Verify PAN | 3 | HR | Document marked Verified |
| 4 | Verify photo & resume | 3 | HR | Document marked Verified |
| 5 | Verify signed offer letter | 3 | HR/Admin | Document marked Verified |
| 6 | Verify education docs (Fresher) / experience docs (Switching) | 3/7 | HR | All relevant docs Verified |
| 7 | Verify cancelled cheque | 4 | HR/Admin | Document marked Verified |
| 8 | Confirm bank details in system | 4 | HR | Bank record saved and confirmed |
| 9 | Trigger/confirm IT provisioning | 9 | HR/IT | IT checklist completed |
| 10 | Assign employee ID | 8 | HR | EMP-YYYY-DEPT-NNN saved |
| 11 | Final HR review | 10 | HR | All stages green; no pending rejection |
| 12 | Activate profile | 10 | HR | Status = ACTIVE; login enabled |
| 13 | Send welcome email | 10 | HR | Email sent (template with credentials, links) |

---

## 10. TIMELINE & SLA

| Stage | Expected completion | SLA (calendar days) | Auto-reminder | Escalation if delayed |
|-------|--------------------|--------------------|----------------|------------------------|
| 1 – Offer Acceptance | Same day | 1 | — | Remind candidate next day |
| 2 – Personal Information | 1–2 days | 2 | Day 1 | Email + HR alert day 2 |
| 3 – Document Upload | 3–5 days | 5 | Day 3 | Escalate to HR day 5 |
| 4 – Bank Details | 1 day | 1 | With Stage 3 | — |
| 5 – Emergency Contact | 1 day | 1 | With Stage 2/3 | — |
| 6 – Education Details | 2–3 days | 3 | Day 2 | — |
| 7 – Experience Details (Switching) | 3–5 days | 5 | Day 3 | Escalate day 5 |
| 8 – ID Generation | After 3 verified | 1 | — | — |
| 9 – IT Setup | 2–5 days | 5 | Day 3 | Escalate to IT day 5 |
| 10 – HR Review & Activation | 1 day | 1 | — | — |

**Overall onboarding:** Target 10–15 working days from offer acceptance to Active.

**Auto-reminders:**

- To candidate: “You have pending tasks: [list]. Complete by [date].”
- To HR: “Onboarding [name] is pending at stage [X] for [N] days.”
- Configurable per stage (e.g. reminder after 50% of SLA).

**Escalation:**

- If stage exceeds SLA, notify HR manager and optionally recruitment.
- Dashboard widget: “Onboarding overdue” count and list.

---

## 11. SAMPLE ONBOARDING FORM (VISUAL STRUCTURE)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EMPLOYEE ONBOARDING                                                    [Step 2 of 10]
├─────────────────────────────────────────────────────────────────────────────┤
│  Progress: [■■■■■□□□□□] 50%                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STAGE 2: Personal Information ────────────────────────────────────────────┐
│                                                                              │
│  SECTION: Basic Details                                                      │
│  ├─ First Name *          [________________]  Last Name *   [________________]│
│  ├─ Middle Name           [________________]                                │
│  ├─ Date of Birth *       [DD/MM/YYYY]     Gender *         [Dropdown ▼]     │
│  ├─ Marital Status         [Dropdown ▼]    Nationality *     [________________]│
│  └─ Blood Group            [Dropdown ▼]                                       │
│                                                                              │
│  SECTION: Contact                                                            │
│  ├─ Personal Email *      [________________]  Personal Mobile * [__________] │
│  └─ Alternate Mobile       [________________]                                │
│                                                                              │
│  SECTION: Current Address                                                    │
│  ├─ Address (line 1) *    [________________________________________________]  │
│  ├─ City *                [________________]  State *       [________________]│
│  ├─ Pincode *             [________]         Country *      [________________]│
│  └─ ☐ Same as permanent address (skip permanent section)                     │
│                                                                              │
│  SECTION: Permanent Address  [shown if "Same as current" unchecked]          │
│  ├─ Address *             [________________________________________________]  │
│  ├─ City *                [________________]  State *       [________________]│
│  └─ Pincode *             [________]         Country *      [________________]│
│                                                                              │
│  SECTION: Identity (IDs)                                                     │
│  ├─ PAN *                 [________________]  Aadhaar       [________________]│
│  └─ Passport              [________________]                                 │
│                                                                              │
│  [Save draft]  [Next: Document Upload →]                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STAGE 6: Education Details ────────────────────────────────────────────────┐
│  Employee type: (●) Fresher  ( ) Switching  [conditional sections below]     │
│                                                                              │
│  ┌─ FRESHER: Class 10 ────────────────────────────────────────────────┐     │
│  │  School * [________]  Board * [________]  Year * [____]  %/CGPA * [___] │     │
│  │  Marksheet upload * [Choose file] PDF/JPG/PNG, max 5MB               │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│  ┌─ FRESHER: Class 12 ───────────────────────────────────────────────┐   │
│  │  School * [________]  Board * [________]  Year * [____]  %/CGPA * [___] │   │
│  │  Marksheet upload * [Choose file]                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─ Graduation (and PG if any) ────────────────────────────────────────┐   │
│  │  Qualification * [________]  Institution * [________]  University * [__] │   │
│  │  Year * [____]  %/CGPA * [____]  Division [Dropdown]  Specialization [__] │   │
│  │  Start date [____]  End date [____]                                    │   │
│  │  Marksheet * [Choose file]  Degree certificate * [Choose file]          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ SWITCHING: Highest qualification only ─────────────────────────────┐   │
│  │  Qualification * [________]  Institution * [________]  University * [__] │   │
│  │  Year of passing * [____]  (Upload optional) [Choose file]             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [Back]  [Save draft]  [Next →]                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ STAGE 7: Experience Details (only if Switching) ──────────────────────────┐
│  ⚠ Shown only when Employee Type = SWITCHING                               │
│                                                                              │
│  Experience 1 (most recent)                                                 │
│  ├─ Company Name *     [________________]  Designation *   [______________] │
│  ├─ Employment Type *  [Full-time ▼]  Start * [____]  End * [____]           │
│  ├─ ☐ Currently working here (notice period)                               │
│  ├─ Reason for leaving [________________________________________________]   │
│  ├─ Last drawn salary  [________]  Currency [INR ▼]                         │
│  ├─ Reporting manager  [________________]  Contact [________________]       │
│  ├─ Relieving/Experience letter * [Choose file] PDF, max 5MB                │
│  └─ Last 3 months salary slips   [Choose file(s)]                             │
│                                                                              │
│  [+ Add another experience]                                                 │
│                                                                              │
│  [Back]  [Save draft]  [Next: ID Generation →]                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Legend:**

- `*` = Required.
- Sections in `[ ]` = conditional (e.g. “Permanent address” if not same as current; “Experience” only for Switching; “Class 10/12” only for Fresher).
- File uploads show: allowed format and max size under each control.

---

## Implementation notes (for developers)

1. **Employee type:** Set at offer (FRESHER / SWITCHING) and stored on onboarding/employee record; drive Stage 7 visibility and education field requirements from this.
2. **Stages:** Implement as steps (wizard or separate pages); allow “Save draft” at each step; block “Next” until required fields for that stage are valid.
3. **Documents:** Store in blob storage or file system; DB holds path, type, verification status, verified_by, verified_at, rejection_reason. Version on re-upload.
4. **Status:** Single current status per onboarding; transitions as per section 5; use enum in DB and validate transitions in API.
5. **Employee ID:** Generate in Stage 8 using department and year; use DB sequence or max(sequence)+1 per department per year with lock to avoid duplicates.
6. **Permissions:** Candidate sees only own onboarding; HR sees list and verification actions; Admin can see all and override if needed.

---

*End of specification.*

# VidyaBank Partner Dashboard: 22 Modules Reference Manual

This document details the 22 core modules of the **VidyaBank Partner Portal**, describing their layout hierarchy, target routing paths, and key business logic features.

---

## 1. Module 01: Overview Dashboard
*   **Route:** `/bank/dashboard`
*   **Icon:** `dashboard`
*   **Purpose:** The central command center for bank auditors. It compiles active portfolios, tracks SLA warning deadlines, highlights critical verification alerts, and provides a centralized landing summary of loan files.

## 2. Module 02: Scheduling Matrix
*   **Route:** `/bank/calendar`
*   **Icon:** `calendar_month`
*   **Purpose:** Renders a monthly/weekly calendar grid tracking crucial date thresholds, including sanction expiries, SLA warnings, and upcoming scheduled tranche payout dates.

## 3. Module 03: Incoming Queue
*   **Route:** `/bank/incoming`
*   **Icon:** `download`
*   **Purpose:** Gathers incoming applicant folders forwarded from the core VidyaLoans system, awaiting basic validation checks, manual document review, and assigning of unique Loan Account Numbers (LAN).

## 4. Module 04: My Files (Logged)
*   **Route:** `/bank/applications`
*   **Icon:** `assignment`
*   **Purpose:** The primary application directory for bank credit teams. Contains filters by borrower tags, applicant search bars, and the main data tables for logged case files.

## 5. Module 05: Pipeline Kanban
*   **Route:** `/bank/kanban`
*   **Icon:** `view_kanban`
*   **Purpose:** A visual, interactive drag-and-drop workflow board. Enables credit teams to transition files dynamically through processing stages: Incoming, Logged, Under Review, Decided, and Closed.

## 6. Module 06: Document Vault
*   **Route:** `/bank/documents`
*   **Icon:** `folder_shared`
*   **Purpose:** A secure document appraisal repository. Renders student files (KYC proof, academic marksheets, co-borrower income statements, university admission letters) with zoom, rotation, status verification checklists, and bulk zip downloading.

## 7. Module 07: Underwriting Matrix
*   **Route:** `/bank/decisions`
*   **Icon:** `gavel`
*   **Purpose:** The credit evaluation workspace. Enables auditors to perform risk profile evaluations, set interest rates, authorize processing fees/waivers, attach covenants, formulate conditional offers, and log final sanction/rejection verdicts.

## 8. Module 08: Disbursement Desk
*   **Route:** `/bank/disbursements`
*   **Icon:** `payments`
*   **Purpose:** Manages multi-tranche disbursements. Renders beneficiary bank accounts, validates RTGS/NEFT transaction ref numbers, tracks remaining balances, and updates the ledger upon successful tranche payouts.

## 9. Module 09: Fee Desk
*   **Route:** `/bank/fees`
*   **Icon:** `receipt_long`
*   **Purpose:** Handles processing fee tracking. Logs payments made online, by card, or via demand drafts. Includes authorization protocols for managers to override and fully waive processing fees.

## 10. Module 10: Secure Chat Stream
*   **Route:** `/bank/chat`
*   **Icon:** `forum`
*   **Purpose:** Direct secure chat bridge connecting bank auditors with students or relationship managers, allowing quick resolution of verification queries.

## 11. Module 11: Task Matrix
*   **Route:** `/bank/tasks`
*   **Icon:** `assignment_add`
*   **Purpose:** Workload management center. Allocates files to officers, maps task queues, monitors verification progress, and tracks credit officer performance.

## 12. Module 12: Channel Intelligence
*   **Route:** `/bank/analytics`
*   **Icon:** `monitoring`
*   **Purpose:** Portfolio analytics center. Generates visual charts for portfolio yield assessments, age-wise case analysis, cohort breakdowns, and SLA compliance metrics.

## 13. Module 13: System Integrations
*   **Route:** `/bank/integrations`
*   **Icon:** `extension`
*   **Purpose:** The connectivity hub linking the partner portal with external CRMs (Salesforce lead syncing) and workspace collaboration channels (Slack webhook dispatches for sanction alerts).

## 14. Module 14: Branch Matrix
*   **Route:** `/bank/branches`
*   **Icon:** `lan`
*   **Purpose:** A geographical performance workspace. Maps target performance metrics, monitors caseload allocations, and tracks disbursement volumes across localized bank branches.

## 15. Module 15: Active Products
*   **Route:** `/bank/products`
*   **Icon:** `shopping_bag`
*   **Purpose:** Product catalog configurator. Configures education loan offerings, establishing min/max thresholds, co-applicant criteria, and default interest rates.

## 16. Module 16: Bank Schemes
*   **Route:** `/bank/schemes`
*   **Icon:** `card_membership`
*   **Purpose:** Promotional schemes manager. Builds interest rate subsidy packages, central and state scheme eligibility criteria, and campaign duration limits.

## 17. Module 17: Officer Targets
*   **Route:** `/bank/targets`
*   **Icon:** `track_changes`
*   **Purpose:** Targets and goals dashboard for individual credit officers. Tracks disbursement achievements against monthly and quarterly quotas.

## 18. Module 18: Analytical Reports
*   **Route:** `/bank/reports`
*   **Icon:** `mail_lock`
*   **Purpose:** Auto-report builder. Schedules routine exports (Applications Summary, SLA Metrics, Branch Caseloads) and automatically dispatches them to risk heads.

## 19. Module 19: Sanction Letter Engine
*   **Route:** `/bank/sanction-letter`
*   **Icon:** `description`
*   **Purpose:** Interactive digital sanction letter creator. Selects target applicants, auto-fills financial parameters, offers a live A4 preview layout, and enables digital e-signature overlays.

## 20. Module 20: Quarterly Feedback
*   **Route:** `/bank/feedback`
*   **Icon:** `rate_review`
*   **Purpose:** Partner feedback portal. Collects Net Promoter Scores (NPS) and structured user ratings to help VidyaLoans relationship managers optimize platform APIs and features.

## 21. Module 21: Help Center
*   **Route:** `/bank/help`
*   **Icon:** `help_center`
*   **Purpose:** Support resource center. Features classified FAQs, training walkthrough video players, technical support ticket generators, and an interactive step-by-step auditor certification onboarding wizard.

## 22. Module 22: Settings & Profile
*   **Route:** `/bank/settings`
*   **Icon:** `settings`
*   **Purpose:** Auditor account management. Configures user contact details, notification triggers, automated assignment criteria, and profile access credentials.

# VidyaBank Partner Portal: Detailed End-to-End Flow & Architecture Guide

This guide provides a step-by-step walkthrough of the entire loan application processing pipeline inside the **VidyaBank Partner Portal**. It explains exactly what occurs on the user interface, what happens in the backend logic, and what changes are committed to the database at every stage.

---

## 1. Application Ingestion Flow (Platform Sync)
The lifecycle of a loan folder begins when a student submits their details on the consumer-facing VidyaLoans portal.

### User Interface & Ingestion
*   **Trigger**: A student completes their profile, uploads required verification documents (Aadhaar, PAN, academic marksheets, and university offer letters), and selects VidyaBank as their preferred lender.
*   **API Action**: The VidyaLoans core service calls the partner bank's ingestion endpoint (`POST /bank/incoming-files` or similar sync hook).

### Backend & Database Processing
*   The system creates a new record in the `LoanApplication` table:
    *   `id`: Automatically generated UUID.
    *   `status`: Initialized to `'pending'`.
    *   `stage`: Initialized to `'pre_login'`.
    *   `submittedAt`: Recorded timestamp.
*   The application folder is immediately listed inside **Module 03: Incoming Queue**.

---

## 2. File Logging & LAN Assignment (Module 03: Incoming Queue)
Before credit evaluation can begin, the file must be formally logged into VidyaBank's internal systems.

```
+-----------------------------------------------------------+
|                     LOG FILE / ASSIGN LAN                 |
|                                                           |
|  Loan Account Number (LAN)                                |
|  [ LAN-IDFC-967432                              ]         |
|                                                           |
|  Priority Level                                           |
|  ( Low )       [ Medium ]        ( High )                 |
|                                                           |
|      [ CANCEL ]                    [ LOG FILE ]           |
+-----------------------------------------------------------+
```

### User Interface Interaction
1.  The auditor navigates to `/bank/incoming` (**Incoming Queue**).
2.  Locates the student's entry and clicks **Log File (Enter LAN)**.
3.  A modal dialog prompts the user with:
    *   **Loan Account Number (LAN)**: Automatically pre-filled with a random alphanumeric code (e.g., `LAN-IDFC-967432`), which can be custom-edited.
    *   **Priority Level**: Low (green tag), Medium (amber tag), or High (rose tag).
4.  Auditor reviews the parameters and clicks **Log File**, then confirms the configuration.

### Backend & Database Processing
1.  Frontend submits a request: `POST /bank/files/:id/log` with payload `{ lanNumber: "LAN-IDFC-967432" }`.
2.  The backend:
    *   Updates the `LoanApplication` record:
        *   `lanNumber` ➜ `"LAN-IDFC-967432"`
        *   `lanEnteredAt` ➜ Current Timestamp
        *   `status` ➜ `"file_logged"`
        *   `stage` ➜ `"under_review"`
    *   Appends a text audit trail to `LoanApplication.remarks`:
        `"[Bank System - Logged]: Assigned LAN: LAN-IDFC-967432 (Priority: MEDIUM)"`
    *   Creates a corresponding entry in the `FileEntry` table (links the application to the secure document vault).
3.  The application disappears from the **Incoming Queue** and is moved to **Module 04: My Files (Logged)**.

---

## 3. Document Review & Appraisal (Module 06: Document Vault)
The credit team must examine the validity of all uploaded KYC and academic records.

### User Interface Interaction
1.  The auditor navigates to `/bank/documents` (**Document Vault**) or opens the detail drawer in **My Files (Logged)**.
2.  The screen displays a structured tree of files (e.g., "Personal Documents", "Academic Transcripts", "Financial Proofs").
3.  The built-in document viewer supports:
    *   PDF and Image viewing.
    *   Canvas adjustments (zoom in/out, rotate 90° for landscape scans).
    *   A validation checklist where the auditor marks each item (e.g., "Marksheet Verified", "Aadhaar Match") as completed.

### Query Management & Resolution Loop (The Clarification Channel)
If a document is invalid, unreadable, or missing, the auditor opens the **Queries** tab in the workspace panel:
1.  **Raise Query**:
    *   The auditor types a query message (e.g., "Father's Income Tax return is missing page 3") and specifies required documents.
    *   Clicks **Raise Query**.
    *   **DB Action**: Creates an entry in the `BankQuery` table (`status: 'OPEN'`). Updates `LoanApplication.stage = 'query_raised'`.
    *   **Notification**: The system automatically sends a notification email and a chat alert to the student portal.
2.  **Student Response**:
    *   The student receives the notification, logs into their portal, uploads the missing page, and types a reply.
    *   **DB Action**: Saves details into the `QueryResponse` table (associated with the `BankQuery` ID).
3.  **Resolution**:
    *   The bank auditor reviews the student's reply, views the new upload, and clicks **Resolve Query**.
    *   **DB Action**: Sets `BankQuery.status = 'RESOLVED'` and updates the `LoanApplication.stage` back to `'under_review'`.

---

## 4. Underwriting Matrix & Appraisal Decision (Module 07: Underwriting Matrix)
This is where the credit officer performs the final financial assessment and registers the bank's decision.

```
   [ SANCTION ]   [ CONDITIONAL ]   [ COUNTER ]   [ REJECT ]   [ QUERIES ]
```

The auditor selects the active tab corresponding to their credit evaluation:

### Option A: Sanction Approved
*   **Action**: Auditor enters the net approved principal amount (e.g., ₹15,00,000) and net ROI (e.g., 9.55% floating). They verify processing fees and select payment modes.
*   **DB Transition**: Updates `LoanApplication` status to `'approved'` and stage to `'sanction'`. Creates a `BankDecision` record (`decision: 'SANCTIONED'`).

### Option B: Conditional Sanction
*   **Action**: Auditor defines custom conditions/covenants (e.g., "Must submit original graduation certificate before disbursement", "Co-borrower must sign guarantor bond").
*   **DB Transition**: Updates `LoanApplication.stage` to `'conditional_sanction'`. The loan remains in processing until the student uploads proof satisfying these covenants.

### Option C: Counter Offer
*   **Action**: If the borrower does not qualify for the full requested amount, the bank offers adjusted terms (e.g., a lower principal of ₹12,00,000 or a higher interest rate).
*   **DB Transition**: Updates `LoanApplication.stage` to `'counter_offer'`. The pipeline pauses until the student logs in to accept or reject the revised terms.

### Option D: Rejected
*   **Action**: Auditor inputs the rejection reasons from a predefined list (e.g., "Insuficient collateral margin", "Co-applicant CIBIL score default") and writes notes.
*   **DB Transition**: Updates `LoanApplication.status = 'rejected'`. The file is moved to the archive queue.

---

## 5. Sanction Letter Generation & E-Signature (Module 19)
Once approved, a legally binding sanction contract must be generated and signed.

### User Interface Interaction
1.  The auditor navigates to `/bank/sanction-letter` (**Sanction Letter Engine**).
2.  Selects the approved applicant. The system auto-fills:
    *   Applicant and co-borrower names.
    *   Sanctioned principal and interest rates.
    *   Covenants, processing fee structures, and validity deadlines.
3.  The interface renders a live, stylized A4 preview of the document.
4.  The auditor signs the letter electronically using the signature canvas pad.
5.  Clicks **Sign & Register**.

### Backend & Database Processing
1.  The server generates a PDF document of the sanction letter.
2.  Creates a unique cryptographic digital signature hash (e.g., `sha256: 8f92a10d93427f7e91...`) and overlays the stamp on the PDF.
3.  Saves the PDF to secure file storage and updates `LoanApplication.sanctionLetterUrl`.
4.  The signed letter appears on the student's portal for signature acceptance.

---

## 6. Multi-Tranche Disbursement (Module 08: Disbursement Desk)
Once the sanction letter is executed, the funds are paid out in installments (tranches) directly to the university or student.

### User Interface Interaction
1.  The university/student submits a disbursement request (e.g. "Tranche 1: Semester 1 Tuition Fees - ₹3,50,000").
2.  The request appears on `/bank/disbursements` (**Disbursement Desk**).
3.  The bank operator reviews:
    *   Sanctioned terms and total headroom.
    *   The university's verified bank account and IFSC details.
4.  The operator initiates the bank transfer via RTGS/NEFT.
5.  Once executed, the operator inputs:
    *   **Tranche Number**: (e.g., Tranche 1).
    *   **UTR Number**: The unique bank transaction reference hash.
    *   **Amount Paid**: (e.g. ₹3,50,000).
6.  Clicks **Confirm Payout**.

### Backend & Database Processing
1.  A new transaction is registered in the `Disbursement` table:
    *   `status`: Set to `'CONFIRMED'`.
    *   `utrNumber`: Recorded for audit.
    *   `confirmedBy`: Logged with the operator's email.
2.  The backend:
    *   Updates the `LoanApplication` status to `'disbursed'`.
    *   Computes and logs the remaining sanctioned balance headroom:
        `Remaining = Approved Sanction - Sum(All Paid Tranches)`.
3.  Once the final tranche is disbursed and the remaining balance is zero, the application status is updated to `'closed'`.

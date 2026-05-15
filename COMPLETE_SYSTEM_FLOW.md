# 🔄 Complete Vidhya Loan Platform Flow Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VIDHYA LOAN PLATFORM - COMPLETE FLOW                     │
└─────────────────────────────────────────────────────────────────────────────┘


                            MULTI-PORTAL SYSTEM
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   STUDENT    │  │    STAFF     │  │     BANK     │  │    AGENT     │   │
│  │   PORTAL     │  │   PORTAL     │  │   PORTAL     │  │   PORTAL     │   │
│  │              │  │              │  │              │  │              │   │
│  │ /apply       │  │ /staff       │  │ /bank        │  │ /agent       │   │
│  │ /dashboard   │  │ /dashboard   │  │ /dashboard   │  │ /dashboard   │   │
│  │ /profile     │  │ /applications│  │ /applications│  │ /applications│   │
│  │ /payments    │  │ /verification│  │ /analytics   │  │ /portfolio   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                  │                  │                │           │
│         └──────────────────┼──────────────────┼────────────────┘           │
│                            │                  │                            │
│                      ┌─────▼──────────────────▼────────┐                   │
│                      │  SHARED AUTH CONTEXT            │                   │
│                      │  (Portal-Specific Tokens)       │                   │
│                      └─────┬──────────────────┬────────┘                   │
│                            │                  │                            │
└────────────────────────────┼──────────────────┼────────────────────────────┘
                             │                  │
                      ┌──────▼──────────────────▼──────┐
                      │     BACKEND API SERVER         │
                      │     (NestJS)                   │
                      │                                │
                      │  ├─ Auth Service               │
                      │  ├─ Application Service        │
                      │  ├─ Document Service           │
                      │  ├─ Payment Service            │
                      │  ├─ Email/SMS Service          │
                      │  └─ Analytics Service          │
                      └──────┬────────────────┬────────┘
                             │                │
                      ┌──────▼────────────────▼──────┐
                      │   DATABASE (PostgreSQL)      │
                      │                              │
                      │  ├─ Users Table              │
                      │  ├─ Applications Table       │
                      │  ├─ Documents Table          │
                      │  ├─ Payments Table           │
                      │  ├─ Transactions Table       │
                      │  └─ Audit Logs Table         │
                      └──────────────────────────────┘
```

---

## 📍 Complete Journey Map - Student to Bank to Disbursement

```
STEP 1: STUDENT APPLICATION SUBMISSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Student Portal: /apply
│
├─ Fill Application Form
│  ├─ Personal Details (Name, DOB, Phone, Email)
│  ├─ Education Details (Institution, Course, Duration)
│  ├─ Financial Details (Loan Amount, Purpose)
│  └─ Co-signer Information
│
├─ Upload Documents
│  ├─ Aadhaar Card
│  ├─ PAN Card
│  ├─ Admit Letter
│  ├─ Bank Statements
│  ├─ Income Proof
│  └─ Other documents
│
├─ Submit Application
│  └─ Status: PENDING ⏳
│
├─ Confirmation Email/SMS
│  └─ "Your application #APP-0001 is received"
│
└─ Student sees on dashboard:
   ├─ Status: Pending
   ├─ Application ID
   ├─ Documents uploaded
   └─ "Waiting for staff review"


STEP 2: STAFF REVIEW & VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Staff Portal: /staff/dashboard
│
├─ Staff Sees New Application in Queue
│  ├─ Application #APP-0001: John Doe
│  ├─ Loan Amount: ₹12,00,000
│  └─ Status: PENDING
│
├─ Staff Reviews Application
│  ├─ Reads student profile
│  ├─ Verifies all documents:
│  │  ├─ Aadhaar: ✅ Verified
│  │  ├─ PAN: ✅ Verified
│  │  ├─ Admit Letter: ✅ Verified
│  │  ├─ Bank Statements: ✅ Verified
│  │  └─ Income Proof: ✅ Verified
│  │
│  ├─ Checks Document Authenticity
│  │  └─ System runs fraud detection algorithms
│  │
│  ├─ Adds Internal Notes
│  │  ├─ "Document verification complete"
│  │  ├─ "Admits from top university"
│  │  ├─ "Solid financial background"
│  │  └─ "Recommend approval"
│  │
│  └─ Verifies Collateral (if applicable)
│
├─ Staff Forwards to Bank
│  └─ Status: PENDING → SUBMITTED ✅
│
├─ System Actions
│  ├─ Email staff: "Application verified"
│  ├─ Email student: "Your application is under bank review"
│  └─ Push notification: "Status updated: Under Bank Review"
│
└─ Staff Dashboard Updated
   └─ Application count: 47 → 46 (one less pending)


STEP 3: BANK REVIEW & DECISION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bank Portal: /bank/applications
│
├─ Bank Manager Sees Application in Queue
│  ├─ Status: SUBMITTED
│  ├─ Priority: Medium (1 day pending)
│  └─ Alert: "Staff recommends approval"
│
├─ Bank Manager Reviews Details
│  ├─ Checks applicant profile
│  ├─ Reads staff notes ✓ (Positive)
│  ├─ Analyzes documents (All verified) ✓
│  ├─ Checks credit score: 780 (Excellent) ✓
│  ├─ Calculates income-to-loan ratio: 50% (Good) ✓
│  ├─ Assesses collateral: ₹2Cr property (Excellent) ✓
│  └─ Fraud detection: PASSED ✓
│
├─ Bank Manager Sets Loan Terms
│  ├─ Opens "Loan Multipliers" section
│  ├─ Sets Interest Rate: 9.5% (Best rate for excellent credit)
│  ├─ Sets Tenure: 12 Years
│  ├─ Calculates EMI: ₹12,000/month
│  └─ Assigns to: Agent Smith (Credit Team)
│
├─ Bank Manager Makes Decision: APPROVE ✅
│  └─ Clicks "VALIDATE NODE" button
│
├─ System Actions
│  ├─ Status: SUBMITTED → APPROVED ✅
│  ├─ Generate loan agreement with above terms
│  ├─ Create loan account
│  ├─ Schedule disbursement
│  ├─ Email student: "Congratulations! Your loan is approved!"
│  ├─ WhatsApp: "Your ₹12,00,000 loan approved at 9.5%!"
│  ├─ Schedule: "Sign documents within 48 hours"
│  ├─ Email bank: "New approved loan - Agent Smith"
│  ├─ Update portfolio metrics on dashboard
│  └─ Send to DigiLocker for signature
│
└─ Bank Dashboard Updated
   ├─ Total approved today: 23 → 24
   ├─ Total disbursement pending: 12 → 13
   └─ Portfolio value: ₹XX Cr → ₹XX+1.2Cr


STEP 4: LOAN AGREEMENT SIGNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Student Portal: /dashboard/approved-loans
│
├─ Student Sees Approval Notification 🎉
│  ├─ "Your loan of ₹12,00,000 is approved!"
│  ├─ Interest Rate: 9.5%
│  ├─ Tenure: 12 Years
│  ├─ Monthly EMI: ₹12,000
│  └─ Status: AWAITING SIGNATURE
│
├─ Student Reviews Loan Agreement
│  ├─ Download PDF with full terms
│  ├─ Terms clearly stated:
│  │  ├─ Principal: ₹12,00,000
│  │  ├─ Interest Rate: 9.5% per annum
│  │  ├─ Repayment Start: After 6 months (moratorium)
│  │  ├─ EMI: ₹12,000/month
│  │  ├─ Total Amount Payable: ₹17,28,000
│  │  └─ Payment Schedule: Provided
│  │
│  ├─ Co-signer (Father) Also Reviews
│  │  └─ Gets separate link via email
│  │
│  └─ Both Sign Using DigiLocker E-signature
│     ├─ OTP verification
│     ├─ Digital signature
│     └─ Timestamp recorded
│
├─ System Actions After Signing
│  ├─ Status: APPROVED → SIGNED ✓
│  ├─ Send signed agreement to bank
│  ├─ Store in digital vault
│  ├─ Email confirmation to student & co-signer
│  ├─ Notify agent (Account Manager)
│  └─ Move to disbursement queue
│
└─ Bank Notification
   └─ "Loan #LN-00123 signed - Ready for disbursement"


STEP 5: DISBURSEMENT PROCESSING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bank Portal: /bank/tasks → Disbursement Queue
│
├─ Account Manager (Agent Smith) Gets Task
│  ├─ Notification: "Signed loan ready for disbursement"
│  ├─ Loan Details:
│  │  ├─ Loan ID: LN-00123
│  │  ├─ Applicant: John Doe
│  │  ├─ Amount: ₹12,00,000
│  │  ├─ Status: SIGNED & READY
│  │  └─ Deadline: Within 24 hours
│  │
│  ├─ Verify Disbursement Details
│  │  ├─ Student bank account verified
│  │  ├─ IFSC code confirmed
│  │  ├─ Account holder name matches
│  │  └─ No fraud flags
│  │
│  ├─ Initiate Fund Transfer
│  │  ├─ Bank processing:
│  │  │  ├─ Debit ₹12,00,000 from bank pool
│  │  │  ├─ Generate transaction reference
│  │  │  └─ Initiate NEFT/RTGS transfer
│  │  │
│  │  └─ Expected time: 1-4 hours
│  │
│  └─ Click "Process Disbursement"
│     └─ Status: SIGNED → DISBURSEMENT_IN_PROGRESS
│
├─ Payment Gateway Processing
│  ├─ Bank system validates transfer
│  ├─ RBI inter-bank clearing
│  ├─ Student bank receives funds
│  └─ Transaction reference generated
│
├─ System Actions
│  ├─ Status: DISBURSEMENT_IN_PROGRESS → DISBURSED ✅
│  ├─ Record transaction in ledger
│  ├─ Email student: "Your loan amount ₹12,00,000 is disbursed!"
│  ├─ WhatsApp: "Funds received in your account (Ref: TXN-00001)"
│  ├─ Email bank: "Loan LN-00123 successfully disbursed"
│  ├─ Create repayment schedule
│  ├─ Update portfolio metrics
│  └─ Trigger post-disbursement tasks
│
└─ Account Manager Confirms
   ├─ Mark task as complete
   ├─ Log into system
   └─ Move to follow-up stage


STEP 6: STUDENT RECEIVES FUNDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Student Bank Account
│
├─ Fund Transfer Received
│  ├─ Amount: ₹12,00,000 credited
│  ├─ From: VidhyaBank (Loan Disbursal)
│  ├─ Reference: TXN-00001, LN-00123
│  ├─ Time: 2:45 PM
│  └─ Balance Updated
│
├─ Student Notifications
│  ├─ Email from VidhyaBank: "Congratulations! Your loan is disbursed"
│  ├─ Email from Bank: "Transaction receipt and details"
│  ├─ WhatsApp: "₹12,00,000 received! Download receipt from app"
│  ├─ SMS from bank: "Credit of ₹12,00,000"
│  └─ Student dashboard: "LOAN ACTIVE ✅"
│
├─ Student Can Now
│  ├─ Download transaction receipt
│  ├─ View loan account details
│  ├─ See repayment schedule
│  ├─ Check first EMI due date (After 6 months)
│  └─ Upload fee payment receipts (proof to college)
│
└─ Student Takes Next Steps
   ├─ Transfer funds to university
   ├─ Pay college fees
   ├─ Begin studies
   └─ Set reminder for first EMI (Month 7)


STEP 7: REPAYMENT MONITORING (6+ Months)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6-Month Moratorium Period (No payments due)
├─ Student focuses on studies
├─ Bank tracks student progress
└─ Loan account remains active

Month 7: First EMI Due
│
├─ Bank Systems
│  ├─ Generate first EMI invoice: ₹12,000
│  ├─ Email reminder to student (15 days before)
│  ├─ WhatsApp reminder (5 days before)
│  ├─ SMS on due date (Day 0)
│  └─ Auto-debit setup (if opted)
│
├─ Student Payment Options
│  ├─ Auto-debit from bank account (Easiest)
│  ├─ Manual online payment via portal
│  ├─ Bank transfer
│  ├─ Cheque payment
│  └─ WhatsApp payment link
│
├─ Payment Processing
│  ├─ System records payment
│  ├─ Updates repayment schedule
│  ├─ Sends receipt
│  ├─ Updates remaining balance
│  └─ Calculates interest for next month
│
└─ Bank Portal (Account Manager)
   ├─ Tracks payment status
   ├─ Logs all transactions
   ├─ Monitors for late payments
   ├─ Manages default cases
   └─ Maintains portfolio health

144 Months Later: Loan Fully Repaid ✅
├─ Total paid: ₹17,28,000 (Principal + Interest)
├─ Loan account closed
├─ NOC (No Objection Certificate) issued
├─ Digital record archived
└─ Student gets "Loan Closure" certificate


STEP 8: ONGOING BANK MONITORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Daily Tasks (Account Manager):
├─ Check new disbursements
├─ Monitor overdue payments
├─ Follow up on late payments
├─ Handle payment failures
└─ Log issues

Weekly Reports:
├─ Portfolio status
├─ Collection efficiency
├─ Default analysis
├─ New applications processed
└─ Disbursement progress

Monthly Analytics:
├─ Total active loans
├─ Average loan size
├─ EMI collection rate
├─ Default rate
├─ Customer satisfaction
└─ Revenue metrics

RBI Compliance:
├─ Regulatory reporting
├─ Risk assessment
├─ Audit documentation
├─ Data security checks
└─ Policy compliance
```

---

## 📊 Data Flow Diagram

```
STUDENT UPLOADS DOCUMENTS
        │
        ▼
   CLOUD STORAGE
   (AWS S3/DigitalOcean)
        │
        ├─────────────────────┬──────────────────┐
        │                     │                  │
        ▼                     ▼                  ▼
    DATABASE            VERIFICATION        BACKUP
  (Documents Table)      SYSTEM              STORAGE
        │               (Fraud Detection)
        │                     │
        └─────────────┬───────┘
                      │
                      ▼
              STAFF REVIEW PORTAL
              (Document Verification)
                      │
                      ▼
              BANK REVIEW PORTAL
              (Final Approval)
                      │
        ┌─────────────┴──────────────┐
        │                            │
        ▼                            ▼
    APPROVAL                    REJECTION
      │                           │
      ├─→ Generate Loan Docs      └─→ Mark Archived
      │                               │
      ├─→ Create Account              └─→ Email Student
      │
      ├─→ DigiLocker Signing
      │
      ├─→ Schedule Disbursement
      │
      └─→ Fund Transfer
          │
          ▼
      STUDENT BANK ACCOUNT
      Funds Received ✅
          │
          ├─→ Repayment Schedule
          │
          └─→ EMI Tracking
              │
              ├─→ Monthly Due
              │
              ├─→ Payment Processing
              │
              └─→ Account Statement
```

---

## 👥 Role-Based Data Access

```
┌──────────────────────────────────────────────────────────────────┐
│  WHO CAN SEE WHAT IN THE SYSTEM                                  │
└──────────────────────────────────────────────────────────────────┘

STUDENT
├─ Own application
├─ Own documents
├─ Loan approval status
├─ Loan terms (rate, tenure, EMI)
├─ Repayment schedule
├─ Payment history
└─ Cannot see: Other students, financial decisions

STAFF
├─ All applications
├─ All documents
├─ Applicant verification status
├─ Can add internal notes
├─ Can verify documents
├─ Can request additional info
├─ Can forward to bank
└─ Cannot see: Bank decisions (until forwarded)

BANK MANAGER
├─ All applications (forwarded by staff)
├─ Complete applicant profile
├─ All documents (verified by staff)
├─ Staff notes
├─ Credit score & credit report
├─ Can set interest rate & tenure
├─ Can approve/reject
├─ Can see all disbursements
├─ Can track EMI payments
└─ Cannot see: Unverified applications

AGENT/ACCOUNT MANAGER
├─ Own assigned loans
├─ Customer portfolio
├─ Payment collection status
├─ Can send payment reminders
├─ Can process EMI receipts
├─ Can handle customer queries
└─ Cannot see: Other agents' portfolios

ADMIN/SUPER ADMIN
├─ Everything (All portals)
├─ System monitoring
├─ Analytics & reporting
├─ User management
├─ Can generate reports
└─ Can override decisions (with logging)
```

---

## 🔐 Data Security & Compliance

```
DATA PROTECTION MEASURES:

Encryption:
├─ All documents encrypted in transit (HTTPS/TLS)
├─ Sensitive data encrypted at rest
├─ Database encryption enabled
└─ Backup encryption

Access Control:
├─ Role-based access control (RBAC)
├─ Multi-factor authentication
├─ Session timeout (15 min inactivity)
├─ Audit logging for all actions
└─ IP whitelisting for sensitive operations

Compliance:
├─ RBI Guidelines
├─ GDRP (General Data Protection Regulations)
├─ PCI DSS (Payment Card Industry)
├─ KYC/AML requirements
└─ Data retention policies

Fraud Detection:
├─ Document authentication algorithms
├─ Pattern analysis for suspicious behavior
├─ Real-time fraud alerts
├─ Manual review triggers
└─ Flagging system for follow-up
```

---

## 📈 Example Timeline

```
DAY 1: Monday 9:00 AM
┌─────────────────────┐
│ Student submits app │
└────────────┬────────┘
             ↓
        PENDING ⏳

DAY 2: Tuesday 10:00 AM
┌─────────────────────────────┐
│ Staff completes verification │
└────────────┬────────────────┘
             ↓
        SUBMITTED ✓

DAY 2: Tuesday 4:00 PM
┌──────────────────────────┐
│ Bank receives application │
└────────────┬─────────────┘
             ↓
        PROCESSING 🔄

DAY 3: Wednesday 11:00 AM
┌────────────────────────┐
│ Bank manager approves   │
└────────────┬───────────┘
             ↓
         APPROVED ✅

DAY 3: Wednesday 3:00 PM
┌────────────────────────┐
│ Student signs documents │
└────────────┬───────────┘
             ↓
          SIGNED 📝

DAY 4: Thursday 2:00 PM
┌────────────────────────┐
│ Funds disbursed to bank │
└────────────┬───────────┘
             ↓
       DISBURSED 💰

DAY 4: Thursday 4:30 PM
┌────────────────────────┐
│ Student receives funds  │
└────────────┬───────────┘
             ↓
    ACTIVE & READY 🎓

MONTH 7: Day 1 (First EMI Due)
┌────────────────────────┐
│ First EMI payment due   │
└────────────┬───────────┘
             ↓
    REPAYMENT BEGINS 📊
```

---

**Flow Version**: 1.0  
**Last Updated**: May 1, 2026  
**Diagram Type**: Complete System Architecture  
**Status**: Production Ready ✅

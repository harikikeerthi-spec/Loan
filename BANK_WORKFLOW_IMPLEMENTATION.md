# Bank Workflow Implementation Guide

## Overview

This implementation provides a complete bank loan processing workflow that tracks applications from staff submission through bank processing to final disbursement.

## Workflow States & Transitions

```
SUBMITTED_TO_BANK ──────┐
    ↓                      │
FILE_LOGGED              │
    ↓                      │
UNDER_REVIEW ←──┐        │
    ↓            │        │
QUERY_RAISED ───┘        │
    ↓                      │
├─ SANCTIONED            │
├─ CONDITIONAL_SANCTION  │
├─ COUNTER_OFFER         │
└─ REJECTED ─────────────┘

From SANCTIONED:
    ↓
PROCESSING_FEE
    ↓
DISBURSEMENT_PENDING
    ↓
DISBURSED ✓

From REJECTED:
    ↓
RESUBMIT_OTHER_BANK
    ↓
SUBMITTED_TO_BANK (new bank)
```

## Database Schema

### BankSubmission Table
Tracks the main submission record for each application-bank pair.

**Key Fields:**
- `id`: Unique submission ID
- `applicationId`: References LoanApplication
- `bankId`: Bank identifier
- `bankName`: Bank name
- `workflowStatus`: Current workflow status
- `currentStage`: Current processing stage
- `lanNumber`: Loan Account Number (assigned by bank)
- `fileLoggedAt`: When file was logged
- `decisionStatus`: SANCTIONED, CONDITIONAL_SANCTION, COUNTER_OFFER, REJECTED
- `sanctionAmount`: Amount approved
- `ROI details`: roiType, roiBase, roiEffective, roiSubsidy
- `conditions`: Array of conditions (for CONDITIONAL_SANCTION)
- `counterOfferDetails`: JSONB object with counter terms
- `rejectionReason`: Why application was rejected
- `statusHistory`: JSONB array tracking all status changes

### BankWorkflowHistory Table
Maintains detailed audit trail of all workflow transitions.

**Key Fields:**
- `submissionId`: References BankSubmission
- `applicationId`: References LoanApplication
- `fromStatus`: Previous status
- `toStatus`: New status
- `changedBy`: User who made the change
- `changeReason`: Reason for transition
- `createdAt`: When transition occurred

### BankWorkflowQueryRequest Table
Tracks queries raised by bank during review.

**Key Fields:**
- `submissionId`: References BankSubmission
- `queryType`: DOCUMENT, INFORMATION, CLARIFICATION
- `queryDescription`: Details of query
- `raisedBy`: Who raised the query
- `dueDate`: Response deadline
- `status`: PENDING, RESPONDED, RESOLVED, ESCALATED
- `response`: Staff response to query
- `respondedAt`: When response was submitted

## API Endpoints

### Base URL
```
/api/bank/workflow
```

### Staff Operations

#### 1. Submit Application to Bank
```http
POST /submit
Content-Type: application/json

{
  "applicationId": "app-123",
  "bankId": "sbi",
  "bankName": "State Bank of India",
  "submittedBy": "staff-user-id"
}

Response:
{
  "success": true,
  "data": {
    "id": "submission-456",
    "workflowStatus": "SUBMITTED_TO_BANK",
    "submittedAt": "2026-05-21T10:30:00Z"
  }
}
```

#### 2. Respond to Query
```http
POST /query/:queryId/respond
Content-Type: application/json

{
  "response": "We have attached the additional documents...",
  "respondedBy": "staff-user-id"
}
```

### Bank Operations

#### 1. Log File
```http
POST /:submissionId/log-file
Content-Type: application/json

{
  "lanNumber": "LAN20260521001",
  "loggedBy": "bank-officer-id",
  "notes": "File received and logged"
}

Effect: SUBMITTED_TO_BANK → FILE_LOGGED
```

#### 2. Move to Under Review
```http
PUT /:submissionId/under-review
Content-Type: application/json

{
  "changedBy": "bank-officer-id",
  "notes": "Starting internal review"
}

Effect: FILE_LOGGED → UNDER_REVIEW
```

#### 3. Raise Query
```http
POST /:submissionId/query
Content-Type: application/json

{
  "queryType": "DOCUMENT",
  "queryDescription": "Need updated ITR for 2025",
  "raisedBy": "bank-officer-id",
  "dueDate": "2026-05-28T23:59:59Z"
}

Effect: UNDER_REVIEW → QUERY_RAISED
```

#### 4. Sanction Application
```http
POST /:submissionId/sanction
Content-Type: application/json

{
  "sanctionAmount": 1200000,
  "roiType": "FLOATING",
  "roiBase": 7.5,
  "roiEffective": 8.25,
  "roiSubsidy": 0.75,
  "tenure": 120,
  "decisionNotes": "Approved based on strong credit profile",
  "decidedBy": "bank-manager-id"
}

Effect: UNDER_REVIEW → SANCTIONED
```

#### 5. Conditional Sanction
```http
POST /:submissionId/conditional-sanction
Content-Type: application/json

{
  "sanctionAmount": 1200000,
  "roiType": "FLOATING",
  "roiBase": 7.5,
  "roiEffective": 8.25,
  "tenure": 120,
  "conditions": [
    "Provide security deposit of ₹50,000",
    "Co-applicant income verification required"
  ],
  "decisionNotes": "Approved subject to conditions",
  "decidedBy": "bank-manager-id"
}

Effect: UNDER_REVIEW → CONDITIONAL_SANCTION
```

#### 6. Make Counter Offer
```http
POST /:submissionId/counter-offer
Content-Type: application/json

{
  "sanctionAmount": 1000000,
  "roiType": "FLOATING",
  "roiBase": 8.0,
  "roiEffective": 8.75,
  "tenure": 120,
  "terms": "Lower amount due to income constraints",
  "decidedBy": "bank-manager-id"
}

Effect: UNDER_REVIEW → COUNTER_OFFER
```

#### 7. Reject Application
```http
POST /:submissionId/reject
Content-Type: application/json

{
  "reason": "CIBIL score below threshold",
  "category": "CREDIT",
  "decisionNotes": "Applicant does not meet credit policy",
  "decidedBy": "bank-manager-id"
}

Effect: UNDER_REVIEW → REJECTED
```

#### 8. Move to Processing Fee
```http
PUT /:submissionId/processing-fee
Content-Type: application/json

{
  "feeAmount": 12000,
  "changedBy": "bank-officer-id"
}

Effect: SANCTIONED → PROCESSING_FEE
```

#### 9. Mark Fee as Paid
```http
PUT /:submissionId/fee-paid
Content-Type: application/json

{
  "changedBy": "bank-officer-id"
}

Effect: PROCESSING_FEE → DISBURSEMENT_PENDING
```

#### 10. Confirm Disbursement
```http
POST /:submissionId/disburse
Content-Type: application/json

{
  "amount": 1200000,
  "referenceNo": "UTR20260521000123",
  "confirmedBy": "bank-officer-id"
}

Effect: DISBURSEMENT_PENDING → DISBURSED
```

### Query Endpoints

#### Get Submission Details
```http
GET /:submissionId

Response:
{
  "success": true,
  "data": {
    "submission": { /* BankSubmission record */ },
    "queries": [ /* Array of BankWorkflowQueryRequest */ ],
    "history": [ /* Array of BankWorkflowHistory */ ]
  }
}
```

#### Get Bank Incoming Applications
```http
GET /bank/:bankId/incoming?status=SUBMITTED_TO_BANK&limit=20&offset=0

Response:
{
  "success": true,
  "data": [ /* Array of submissions */ ],
  "pagination": { "total": 150, "limit": 20, "offset": 0 }
}
```

#### Get Bank Workflow Analytics
```http
GET /bank/:bankId/analytics

Response:
{
  "success": true,
  "data": {
    "totalApplications": 250,
    "byStatus": { "SUBMITTED_TO_BANK": 5, "UNDER_REVIEW": 15, ... },
    "byDecision": { "SANCTIONED": 80, "REJECTED": 20, ... },
    "totalSanctioned": 96000000,
    "totalDisbursed": 72000000,
    "pendingDecision": 20
  }
}
```

## Frontend Components

### 1. ShareWithBankModal
**Location:** `frontend/components/staff/ShareWithBankModal.tsx`

Component for staff to share applications with banks.

**Usage:**
```tsx
import ShareWithBankModal from "@/components/staff/ShareWithBankModal";

<ShareWithBankModal
  applicationId="app-123"
  applicationNumber="APP-0001"
  studentName="John Doe"
  loanAmount={1200000}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={() => {
    // Refresh application list
  }}
/>
```

### 2. BankWorkflowVisualizer
**Location:** `frontend/components/bank/BankWorkflowVisualizer.tsx`

Displays workflow status visually with timeline.

**Usage:**
```tsx
import BankWorkflowVisualizer from "@/components/bank/BankWorkflowVisualizer";

<BankWorkflowVisualizer
  currentStatus="UNDER_REVIEW"
  history={workflowHistory}
/>
```

## Integration with Staff Dashboard

To add the "Share with Bank" button to the staff dashboard:

```tsx
// In staff/applications/[id]/page.tsx or similar

const [showShareModal, setShowShareModal] = useState(false);

return (
  <>
    <button
      onClick={() => setShowShareModal(true)}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
    >
      <span className="material-symbols-outlined">send</span>
      Share with Bank
    </button>

    <ShareWithBankModal
      applicationId={application.id}
      applicationNumber={application.applicationNumber}
      studentName={`${application.firstName} ${application.lastName}`}
      loanAmount={application.amount}
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
      onSuccess={() => {
        // Refresh application
      }}
    />
  </>
);
```

## Event Flow

### When Application is Submitted to Bank
1. `BankSubmission` record created with status `SUBMITTED_TO_BANK`
2. `BankWorkflowHistory` entry created
3. `LoanApplication` updated with `bankSubmissionId`
4. Event: `bank.submission.created` emitted
5. Bank receives notification

### When File is Logged
1. Status changes: `SUBMITTED_TO_BANK` → `FILE_LOGGED`
2. LAN number assigned
3. `BankWorkflowHistory` entry created
4. Event: `bank.file.logged` emitted

### When Query is Raised
1. New `BankWorkflowQueryRequest` created
2. Status changes: `UNDER_REVIEW` → `QUERY_RAISED`
3. Staff is notified to respond
4. Event: `bank.query.raised` emitted

### When Application is Sanctioned
1. Status changes: `UNDER_REVIEW` → `SANCTIONED`
2. Sanction details stored
3. Processing fee requirements set
4. Event: `bank.application.sanctioned` emitted
5. Student notified of approval

### When Application is Disbursed
1. Status changes: `DISBURSEMENT_PENDING` → `DISBURSED`
2. Disbursement details recorded
3. Event: `bank.application.disbursed` emitted
4. Final confirmation sent to all parties

## Error Handling

### Invalid Transitions
Attempting an invalid status transition will return:
```json
{
  "success": false,
  "message": "Cannot transition from SUBMITTED_TO_BANK to SANCTIONED"
}
```

### Missing Required Fields
```json
{
  "success": false,
  "message": "lanNumber is required"
}
```

### Duplicate Submissions
```json
{
  "success": false,
  "message": "Application already submitted to this bank"
}
```

## Deployment Steps

### 1. Run Database Migration
```bash
cd server
node migrate_bank_workflow.js
```

### 2. Restart Backend
```bash
npm start:dev
```

### 3. Deploy Frontend
```bash
cd frontend
npm run build
npm start
```

### 4. Test Endpoints
```bash
# Test submit to bank
curl -X POST http://localhost:3001/api/bank/workflow/submit \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "test-app-id",
    "bankId": "sbi",
    "bankName": "State Bank of India",
    "submittedBy": "staff-id"
  }'
```

## Key Features

✓ Complete workflow state machine with validation
✓ Query/clarification request system
✓ Multiple decision paths (sanction, conditional, counter, reject)
✓ Resubmission to other banks after rejection
✓ Processing fee tracking
✓ Disbursement confirmation
✓ Comprehensive audit trail
✓ Real-time status tracking
✓ Analytics and reporting
✓ Event-driven architecture

## Future Enhancements

1. **WebSocket Integration** - Real-time notifications
2. **Document Verification** - Auto-sync documents from staff
3. **SLA Monitoring** - Track processing times
4. **Bulk Operations** - Process multiple applications
5. **Report Generation** - PDF/Excel exports
6. **Mobile Support** - iOS/Android apps
7. **Advanced Analytics** - Predictive modeling
8. **Integration with Bank Systems** - FINACLE API

## Support & Troubleshooting

For issues:
1. Check `BankWorkflowHistory` for transition trail
2. Verify `statusHistory` field in `BankSubmission`
3. Check application logs for event emissions
4. Verify JWT token and bank ID in requests

## Last Updated
May 21, 2026

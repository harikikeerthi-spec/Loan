# Dynamic Bank Dashboard Implementation Guide

## Overview
This document describes the complete implementation of the Dynamic Bank Dashboard system for VidyaLoans' bank portal. The system provides comprehensive file management, decision tracking, analytics, and audit capabilities.

---

## Table of Contents
1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [Frontend Components](#frontend-components)
4. [Setup Instructions](#setup-instructions)
5. [Usage Examples](#usage-examples)
6. [Role-Based Access Control](#rbac)

---

## Database Schema

### New Tables Added

#### BankProduct
Stores bank-specific loan product configurations
- `id`: UUID (Primary Key)
- `bankId`: TEXT (Bank identifier)
- `productName`: VARCHAR(255) (e.g., "SBI Scholar Loan")
- `eligibility`: JSONB (Eligibility criteria)
- `maxAmount`, `minAmount`: DOUBLE PRECISION
- `roiMin`, `roiMax`: DOUBLE PRECISION
- `processingFee`: DOUBLE PRECISION (percentage)
- `maxTenure`: INTEGER (months)
- `moratoriumRule`: VARCHAR (e.g., "COURSE_PLUS_12_MONTHS")
- `requiredDocs`: JSONB (Array of document types)
- `isActive`: BOOLEAN (Default: true)
- `createdAt`: TIMESTAMP

#### BankBranch
Bank branch information
- `id`: UUID (Primary Key)
- `bankId`: TEXT
- `branchName`, `branchCode`: VARCHAR
- `coverageAreas`: JSONB (States/cities)
- `maxCapacity`: INTEGER (files per month)
- `createdAt`: TIMESTAMP

#### BankDecision
Complete loan decision tracking (replaces disparate decision tables)
- `id`: UUID (Primary Key)
- `applicationId`: TEXT
- `bankId`: TEXT
- `decision`: VARCHAR (SANCTIONED, CONDITIONAL, COUNTER_OFFER, REJECTED)
- `sanctionAmount`, `interestRate`, `tenure`: Numerical fields
- `roiType`: VARCHAR (FIXED, FLOATING)
- `conditions`: JSONB (Array of conditions)
- `conditionDeadline`: TIMESTAMP
- `counterOffer`: JSONB
- `rejectionReason`: VARCHAR
- `sanctionLetterUrl`: TEXT
- `sanctionExpiry`: TIMESTAMP
- `decidedBy`, `decidedAt`: Audit fields

#### ProcessingFee
Processing fee tracking with payment status
- `id`: UUID (Primary Key)
- `applicationId`: TEXT UNIQUE
- `lanNumber`: VARCHAR
- `feeAmount`, `gstAmount`, `totalAmount`: DOUBLE PRECISION
- `status`: VARCHAR (PENDING, PAID, WAIVED, REFUNDED)
- `paymentMode`: VARCHAR (ONLINE, CHEQUE, DD, DEDUCTED_FROM_LOAN)
- `paymentRef`: VARCHAR
- `paidAt`, `waivedBy`, `waiverReason`: Optional fields

#### Disbursement
Tranche-wise disbursement tracking
- `id`: UUID (Primary Key)
- `applicationId`: TEXT
- `trancheNumber`: INTEGER (Default: 1)
- `amount`: DOUBLE PRECISION
- `mode`: VARCHAR (NEFT, RTGS, DD)
- `utrNumber`: VARCHAR
- `beneficiary`: VARCHAR
- `status`: VARCHAR (CONFIRMED, PENDING, etc.)
- `disbursedAt`, `confirmedAt`: TIMESTAMP
- `confirmedBy`: TEXT
- `remainingSanction`: DOUBLE PRECISION

#### BankQuery
Query/clarification request system
- `id`: UUID (Primary Key)
- `applicationId`: TEXT
- `raisedBy`: TEXT (Bank officer email)
- `queryType`: VARCHAR (DOCUMENT, INFORMATION, CLARIFICATION)
- `description`: TEXT
- `requiredDocs`: JSONB
- `status`: VARCHAR (OPEN, RESPONDED, RESOLVED)
- `raisedAt`, `resolvedAt`: TIMESTAMP

#### QueryResponse
Responses to queries
- `id`: UUID (Primary Key)
- `queryId`: TEXT (Foreign Key)
- `respondedBy`: VARCHAR
- `message`: TEXT
- `attachments`: JSONB
- `respondedAt`: TIMESTAMP

#### FileQualityRating
Quality assessment of submitted files
- `id`: UUID (Primary Key)
- `applicationId`: TEXT UNIQUE
- `completeness`, `accuracy`, `clarity`, `overall`: INTEGER (1-5)
- `comments`: TEXT
- `ratedBy`: TEXT
- `ratedAt`: TIMESTAMP

#### ConsentRecord
VLCON consent tracking
- `id`: UUID (Primary Key)
- `studentId`, `bankId`: TEXT
- `consentId`: VARCHAR UNIQUE (VLCON-2026-XXXXX)
- `scope`: VARCHAR
- `consentedAt`, `validTill`: TIMESTAMP

#### AuditLog
Complete audit trail
- `id`: UUID (Primary Key)
- `entityType`: VARCHAR (LOAN, DOCUMENT, DECISION, DISBURSEMENT)
- `entityId`: TEXT
- `action`: VARCHAR (CREATED, UPDATED, SANCTIONED, REJECTED, QUERIED)
- `performedBy`: TEXT
- `role`: VARCHAR (BANK_OFFICER, STAFF, ADMIN, SYSTEM)
- `details`: JSONB
- `ipAddress`: VARCHAR
- `createdAt`: TIMESTAMP

#### ReferralFee
Referral commission tracking
- `id`: UUID (Primary Key)
- `applicationId`: TEXT UNIQUE
- `bankId`: TEXT
- `feeType`: VARCHAR (FLAT, PERCENTAGE)
- `feeAmount`: DOUBLE PRECISION
- `invoiceStatus`: VARCHAR (PENDING, INVOICED, PAID)
- `invoiceNumber`: VARCHAR
- `paidAt`: TIMESTAMP

### Updated LoanApplication Table
New fields added:
- `lanNumber`: VARCHAR UNIQUE
- `lanEnteredAt`: TIMESTAMP
- `fileLoggedBy`: TEXT
- `productId`: TEXT (Reference to BankProduct)
- `branchId`: TEXT (Reference to BankBranch)
- `assignedOfficer`: TEXT
- `assignedStaffId`: TEXT
- `sanctionAmount`: DOUBLE PRECISION
- `sanctionDate`: TIMESTAMP
- `sanctionExpiry`: TIMESTAMP
- `sanctionLetterUrl`: TEXT
- `roiType`: VARCHAR (FIXED, FLOATING)
- `roiBase`, `roiEffective`, `roiSubsidy`: DOUBLE PRECISION
- `priority`: VARCHAR (Default: NORMAL)
- `turnaroundDays`: INTEGER
- `previousSubmissions`: JSONB
- `submissionAttempt`: INTEGER (Default: 1)

---

## API Endpoints

### Base URL
```
/api/bank/dashboard
```

### Products & Configuration

#### Get Bank Products
```http
GET /products
Headers: x-bank-id: <bankId>
Response:
[
  {
    "id": "uuid",
    "bankId": "sbi",
    "productName": "Scholar Loan",
    "roiMin": 7.5,
    "roiMax": 9.5,
    "maxAmount": 1000000
  }
]
```

#### Add Product
```http
POST /products
Headers: x-bank-id: <bankId>
Body:
{
  "productName": "Scholar Loan Plus",
  "roiMin": 7.0,
  "roiMax": 9.0,
  "maxAmount": 1500000,
  "minAmount": 100000,
  "processingFee": 2.5,
  "maxTenure": 120,
  "requiredDocs": ["identity_proof", "admission_letter", "income_proof"]
}
```

#### Update Product
```http
PUT /products/:productId
Body: { Updated product fields }
```

#### Get Branches
```http
GET /branches
```

#### Add Branch
```http
POST /branches
Body:
{
  "branchName": "Mumbai Main Branch",
  "branchCode": "MUM001",
  "coverageAreas": ["Maharashtra", "Goa"],
  "maxCapacity": 500
}
```

### File Logging & LAN

#### Log File with LAN
```http
POST /files/:applicationId/log
Body:
{
  "lanNumber": "VLAN-2026-001"
}
Response:
{
  "success": true,
  "application": { ... updated application ... }
}
```

#### Get File by LAN
```http
GET /files/by-lan/:lanNumber
Response: { Full application details with decisions }
```

### ROI & Processing Fees

#### Set ROI
```http
PUT /applications/:applicationId/roi
Body:
{
  "roiType": "FLOATING",
  "roiBase": 8.2,
  "roiEffective": 9.5,
  "roiSubsidy": 0.5
}
```

#### Set Processing Fee
```http
POST /applications/:applicationId/processing-fee
Body:
{
  "feeAmount": 10000,
  "lanNumber": "VLAN-2026-001"
}
Response:
{
  "id": "fee-uuid",
  "feeAmount": 10000,
  "gstAmount": 1800,
  "totalAmount": 11800,
  "status": "PENDING"
}
```

#### Update Fee Status (Mark as Paid/Waived)
```http
PUT /applications/:applicationId/processing-fee
Body:
{
  "status": "PAID",
  "details": {
    "paymentMode": "ONLINE",
    "paymentRef": "TXN123456"
  }
}
```

### Queries & Clarifications

#### Raise Query
```http
POST /applications/:applicationId/query
Body:
{
  "queryType": "DOCUMENT",
  "description": "Please provide recent salary slips",
  "requiredDocs": ["salary_slips"]
}
Response:
{
  "id": "query-uuid",
  "status": "OPEN",
  "raisedAt": "2026-05-21T10:30:00Z"
}
```

#### Get Queries
```http
GET /queries?applicationId=<applicationId>
Response: [ { query objects } ]
```

#### Respond to Query
```http
POST /queries/:queryId/response
Body:
{
  "message": "Documents received and verified",
  "attachments": [
    { "filename": "salary_slip_01.pdf", "url": "..." }
  ]
}
```

#### Resolve Query
```http
PUT /queries/:queryId/resolve
Response: { Updated query with status: RESOLVED }
```

### Disbursements

#### Confirm Disbursement
```http
POST /applications/:applicationId/disbursement
Body:
{
  "amount": 500000,
  "mode": "NEFT",
  "utrNumber": "12345678901234",
  "beneficiary": "John Student",
  "trancheNumber": 1
}
Response:
{
  "id": "disbursement-uuid",
  "status": "CONFIRMED",
  "disbursedAt": "2026-05-21T14:00:00Z"
}
```

#### Get Disbursements
```http
GET /applications/:applicationId/disbursements
Response: [ { disbursement records } ]
```

#### Get All Disbursements (Bank-wide)
```http
GET /disbursements
```

### Quality Rating

#### Rate File Quality
```http
POST /applications/:applicationId/quality-rating
Body:
{
  "completeness": 5,
  "accuracy": 4,
  "clarity": 5,
  "comments": "Well-organized documentation"
}
Response:
{
  "id": "rating-uuid",
  "overall": 4.67,
  "ratedBy": "banker@sbi.com",
  "ratedAt": "2026-05-21T15:30:00Z"
}
```

### Analytics

#### Channel Analytics
```http
GET /analytics/channel
Response:
{
  "totalApplications": 150,
  "statusBreakdown": {
    "sanctioned": 45,
    "rejected": 12,
    "pending": 93
  },
  "totalAmount": 750000000,
  "averageAmount": 5000000
}
```

#### Rejection Analytics
```http
GET /analytics/rejections
Response:
{
  "totalRejections": 12,
  "reasonBreakdown": {
    "CIBIL_SCORE_LOW": 5,
    "INCOMPLETE_DOCUMENTS": 4,
    "INCOME_INSUFFICIENT": 3
  }
}
```

#### Pipeline Analytics
```http
GET /analytics/pipeline
Response:
[
  {
    "stage": "submitted",
    "count": 30,
    "totalAmount": 150000000
  },
  { ... more stages ... }
]
```

#### Aging Report
```http
GET /analytics/aging
Response:
{
  "0-7_days": 15,
  "8-30_days": 45,
  "31-60_days": 60,
  "60+_days": 30
}
```

#### SLA Metrics
```http
GET /analytics/sla
Response:
{
  "totalDecisions": 57,
  "averageTAT": "21 days"
}
```

### Audit Logs

#### Get Audit Logs
```http
GET /applications/:applicationId/audit-logs
Response:
[
  {
    "id": "audit-uuid",
    "entityType": "LOAN",
    "action": "FILE_LOGGED",
    "performedBy": "banker@sbi.com",
    "role": "BANK_OFFICER",
    "details": { "lanNumber": "VLAN-2026-001" },
    "createdAt": "2026-05-21T10:00:00Z"
  }
]
```

---

## Frontend Components

### DynamicBankDashboard Component
Main dashboard component with tabs for different features:

```tsx
import DynamicBankDashboard from "@/components/bank/DynamicBankDashboard";

export default function Page() {
  return <DynamicBankDashboard />;
}
```

**Features:**
- Real-time analytics updates (auto-refresh every 60s)
- Channel performance metrics
- Application pipeline visualization
- File aging analysis
- Tab-based navigation
- Error handling and retry logic

### BankDashboardAPI Client
TypeScript API client for all dashboard operations:

```typescript
import { createBankDashboardClient } from "@/lib/bank-dashboard-api";

const client = createBankDashboardClient("sbi");

// Log a file
await client.logFile("app-uuid", "VLAN-2026-001");

// Raise a query
await client.raiseQuery("app-uuid", {
  queryType: "DOCUMENT",
  description: "Need salary slips"
});

// Get analytics
const analytics = await client.getChannelAnalytics();
```

---

## Setup Instructions

### 1. Database Migration
Run the migration script to set up all tables:

```bash
cd server
npm run migrate:bank-dashboard
# Or manually:
node migrate_bank_dashboard.js
```

### 2. Register Services & Controllers
The bank module is already configured to include:
- `BankDashboardService`: Service with business logic
- `BankDashboardController`: API endpoint controller

### 3. Frontend Integration
1. Update bank layout to include new component
2. Add API client to your auth context/providers
3. Configure bank ID resolution from user profile

### 4. Environment Variables
Ensure the following are set:
```env
# Backend
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Usage Examples

### Example 1: Complete File Logging Workflow
```typescript
// 1. Log file with LAN
const logged = await client.logFile("app-123", "VLAN-2026-0001");

// 2. Set ROI
await client.setROI("app-123", {
  roiType: "FLOATING",
  roiBase: 8.2,
  roiEffective: 9.5
});

// 3. Set processing fee
const fee = await client.setProcessingFee("app-123", 10000, "VLAN-2026-0001");

// 4. Fetch audit logs
const auditLogs = await client.getAuditLogs("app-123");
console.log("All operations logged:", auditLogs);
```

### Example 2: Query Management
```typescript
// Raise a query for missing documents
const query = await client.raiseQuery("app-123", {
  queryType: "DOCUMENT",
  description: "Please provide bank statements for last 6 months",
  requiredDocs: ["bank_statement"]
});

// Get all queries for application
const queries = await client.getQueries("app-123");

// Respond to query
await client.respondToQuery(query.id, {
  message: "We received the documents. Thank you!",
  attachments: [
    { filename: "acknowledgement.pdf", url: "..." }
  ]
});

// Resolve query
await client.resolveQuery(query.id);
```

### Example 3: Decision & Disbursement
```typescript
// Create a decision (sanctioned)
const decision = await fetch("/api/bank/applications/app-123/decision", {
  method: "POST",
  body: JSON.stringify({
    decision: "SANCTIONED",
    sanctionAmount: 500000,
    interestRate: 9.5,
    tenure: 120
  })
});

// Get disbursements
const disbursements = await client.getDisbursements("app-123");

// Confirm disbursement
await client.confirmDisbursement("app-123", {
  amount: 500000,
  mode: "NEFT",
  utrNumber: "12345678901234",
  beneficiary: "John Student"
});
```

---

## Role-Based Access Control (RBAC)

### Role Definitions

#### BANK_OFFICER (Full Access)
- View all incoming files
- Log files & assign LAN
- Make decisions (sanction/reject/conditional)
- Raise and resolve queries
- Confirm disbursements
- View full analytics and audit logs
- Manage products and branches

#### STAFF (Limited Access)
- View own submitted files
- Cannot access:
  - `disbursements`, `utrNumber`
  - `agentCommission`, `referralFee`
  - Other staff metrics
  - Internal conditions/remarks

#### ADMIN (Unrestricted)
- Full access to all features
- View cross-bank analytics
- Access all audit logs
- Manage bank configurations

### Middleware Implementation
The `BankRbacInterceptor` filters responses based on user role:

```typescript
// Hidden fields by role
HIDDEN_FIELDS = {
  STAFF: ['disbursements', 'utrNumber', 'agentCommission', 
          'referralFee', 'creditScore', 'sanctionConditionsInternal'],
  BANK:  ['disbursements', 'agentCommission', 'referralFee',
          'staffMetrics', 'revenueData'],
  ADMIN: []
};
```

---

## Testing & Validation

### Health Check
```bash
curl http://localhost:3001/api/bank/dashboard/products \
  -H "x-bank-id: sbi"
```

### Test Queries
```bash
# Log a file
curl -X POST http://localhost:3001/api/bank/dashboard/files/app-123/log \
  -H "Content-Type: application/json" \
  -d '{"lanNumber": "VLAN-2026-001"}'

# Get analytics
curl http://localhost:3001/api/bank/dashboard/analytics/channel \
  -H "x-bank-id: sbi"
```

---

## Future Enhancements

1. **Real-time Notifications**: WebSocket support for query responses
2. **Document OCR**: Auto-verification of scanned documents
3. **Bulk Operations**: Batch file logging and decision processing
4. **Export Reports**: Download analytics as PDF/Excel
5. **Integration with Salesforce**: Auto-sync decisions to CRM
6. **Multi-bank Dashboard**: View across multiple bank portfolios

---

## Support & Maintenance

For issues or questions:
1. Check audit logs for operation history
2. Review API response details for error messages
3. Validate database connections and migrations
4. Check role-based access permissions

---

**Last Updated**: May 21, 2026
**Version**: 1.0.0

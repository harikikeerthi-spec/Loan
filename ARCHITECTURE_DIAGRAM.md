# Architecture Diagram: Dynamic Staff Dashboard

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND APPLICATION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           STAFF DASHBOARD - Document Transfer Center        │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                              │   │
│  │  ┌────────────────┐      ┌────────────────┐                │   │
│  │  │   Dashboard    │      │  Profile       │                │   │
│  │  │   View         │      │  Detail View   │                │   │
│  │  │                │◄────►│                │                │   │
│  │  │ • Profiles     │      │ • Documents    │                │   │
│  │  │ • Quick Stats  │      │ • Sharing      │                │   │
│  │  │ • Flow Tracker │      │ • History      │                │   │
│  │  └────────────────┘      └────────────────┘                │   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │        DocumentFlowTracker (Visual Pipeline)        │   │   │
│  │  │     Student → Staff → Bank (Real-time updates)      │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           ▲                                         │
│                           │                                         │
│  ┌────────────────────────┴─────────────────────────────┐           │
│  │      DashboardContext (Global State Management)     │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                      │           │
│  │  • Document Share Tracking                          │           │
│  │  • Cross-Portal Notifications                       │           │
│  │  • Refresh Triggers                                 │           │
│  │  • Portal State                                     │           │
│  │                                                      │           │
│  └──────────────────────────────────────────────────────┘           │
│                           ▲                                         │
│                           │                                         │
│  ┌────────────────────────┴─────────────────────────────┐           │
│  │    useDashboardSync Hooks (Data Synchronization)    │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                                                      │           │
│  │  • useProfileDocumentTransfer()                     │           │
│  │  • useDocumentShareTracking()                       │           │
│  │  • useBulkDocumentOps()                             │           │
│  │  • useDashboardSync()                               │           │
│  │                                                      │           │
│  └──────────────────────────────────────────────────────┘           │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              BACKEND API - staffProfileApi                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  list()                    - Get all profiles                        │
│  get(id)                   - Get single profile with docs            │
│  create(data)              - Create new staff profile                │
│  fetchUserDocuments(id)    - Sync from student                       │
│  getDocuments(id)          - Get profile documents                   │
│  uploadDocument()          - Manual document upload                  │
│  updateDocumentStatus()    - Change doc status                       │
│  removeDocument()          - Delete document                         │
│  shareWithBank()           - Share with bank + generate link         │
│  getShares()               - Get share history                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ Database Operations
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DATABASE - PostgreSQL                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  • staff_profiles      - Link users to target banks                 │
│  • documents           - Document storage metadata                   │
│  • document_shares     - Share records with expiry                   │
│  • share_access_logs   - Bank access tracking                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
STUDENT UPLOADS DOCUMENT
        │
        ▼
┌──────────────────────┐
│ Student Portal       │
│ • Personal Info      │
│ • Academic History   │
│ • Work Experience    │
│ • Document Uploads   │
│ • Application Status │
└──────────┬───────────┘
           │
           │ Auto-sync every 30 seconds
           │ OR Manual sync button
           │
           ▼
┌─────────────────────────────────────┐
│ Staff Dashboard (NEW)               │
│ Document Transfer Center            │
│                                     │
│ 1. Receive Documents               │
│    ├─ Auto-sync from student       │
│    └─ Manual upload by staff       │
│                                     │
│ 2. Review & Manage                 │
│    ├─ View document details        │
│    ├─ Update status                │
│    ├─ Add notes                    │
│    └─ Remove if needed             │
│                                     │
│ 3. Select for Sharing              │
│    ├─ Choose specific docs         │
│    ├─ Review before share          │
│    └─ Set expiry date              │
│                                     │
│ 4. Share with Bank                 │
│    ├─ Generate secure link         │
│    ├─ Set access period            │
│    ├─ Add access notes             │
│    └─ Track sharing activity       │
└─────────────┬───────────────────────┘
              │
              │ Secure Share Link
              │ (Time-limited access)
              │
              ▼
    ┌──────────────────────┐
    │ Bank Portal          │
    │ • View Documents     │
    │ • Review for Loan    │
    │ • Update App Status  │
    │ • Add Comments       │
    └──────────────────────┘
```

## Component Hierarchy

```
App Layout
│
├─ Root (with DashboardProvider)
│
├─ Staff Dashboard (page.tsx)
│  │
│  ├─ Header
│  │
│  ├─ Sidebar
│  │  └─ Navigation Items
│  │     └─ "Document Transfer" ← NEW
│  │
│  └─ Main Content
│     │
│     ├─ Chat Interface (existing)
│     ├─ Applications View (existing)
│     │
│     └─ Document Transfer Center ← NEW
│        │
│        ├─ Dashboard View
│        │  ├─ Stats Cards
│        │  ├─ DocumentFlowTracker
│        │  ├─ Filter Bar
│        │  └─ Profiles Table
│        │
│        └─ Profile View
│           ├─ Profile Info Cards
│           ├─ Documents Section
│           │  ├─ Document List
│           │  ├─ Upload Modal
│           │  └─ Share Modal
│           │
│           └─ Share History Section
│              └─ Share Entries List
```

## Real-time Sync Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Refresh Cycle (Every 30 seconds)                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐                                            │
│  │ useProfile   │                                            │
│  │ Document     │                                            │
│  │ Transfer()   │                                            │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ├─ Fetch: staffProfileApi.get(profileId)            │
│         │                                                    │
│         ├─ Parse: documents[], shares[], metadata           │
│         │                                                    │
│         └─ Set State: lastUpdated = now()                   │
│                                                               │
│  ┌──────────────┐                                            │
│  │ useDocument  │                                            │
│  │ ShareTracking│                                            │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ├─ Fetch: staffProfileApi.getShares(profileId)      │
│         │                                                    │
│         ├─ Parse: shares with expiryDates                   │
│         │                                                    │
│         └─ Set State: shares[] updated                      │
│                                                               │
│  ┌──────────────┐                                            │
│  │ DashBoard    │                                            │
│  │ Context      │                                            │
│  └──────┬───────┘                                            │
│         │                                                    │
│         └─ Trigger refresh events for:                      │
│            - Bank Dashboard                                 │
│            - Student Dashboard                              │
│            - Notifications                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## State Management

```
DashboardContext (Global)
│
├─ sharedDocuments[]
│  └─ { id, profileId, documentIds[], bankName, expiresAt }
│
├─ notifications[]
│  └─ { id, type, message, timestamp }
│
├─ refreshTriggers
│  ├─ profile (counter)
│  ├─ bank (counter)
│  └─ student (counter)
│
└─ currentPortal
   └─ 'student' | 'staff' | 'bank' | 'admin'


useProfileDocumentTransfer Hook (Local)
│
├─ data
│  ├─ studentId
│  ├─ studentName
│  ├─ documents[]
│  ├─ targetBank
│  ├─ loanType
│  ├─ bankStatus
│  └─ lastUpdated
│
├─ loading (boolean)
│
├─ error (string | null)
│
└─ refresh (function)


DocumentTransferCenter Component (Local)
│
├─ view: 'dashboard' | 'profile'
│
├─ profiles[]
│
├─ selectedProfile
│
├─ documents[]
│
├─ shares[]
│
├─ shareForm
│  ├─ bank_name
│  ├─ bank_email
│  ├─ expires_in_days
│  ├─ access_note
│  └─ selectedDocs[]
│
└─ uploadForm
   ├─ file
   ├─ docType
   └─ description
```

## Status Transition Diagram

```
┌──────────────┐
│   PENDING    │  (Document just uploaded)
└──────┬───────┘
       │
       │ Staff reviews
       ▼
┌──────────────────┐
│ UNDER_REVIEW     │  (Staff is analyzing)
└──────┬───────────┘
       │
       ├─→ APPROVED (Ready to share)
       │   │
       │   ▼
       │ ┌──────────┐
       │ │ SHARED   │  (Sent to bank)
       │ └──────────┘
       │
       └─→ REJECTED (Issues found)
           │
           ▼
        ┌──────────────┐
        │ REQUIRES_    │  (Bank needs resubmission)
        │ RESUBMISSION │
        └──────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────┐
│  DOCUMENT ACCESS CONTROL                         │
├─────────────────────────────────────────────────┤
│                                                  │
│  Student:                                       │
│  ├─ Can upload documents                       │
│  ├─ Can see their own documents                │
│  ├─ Cannot see what's shared to banks          │
│  └─ Cannot directly share (Staff intermediary) │
│                                                  │
│  Staff:                                         │
│  ├─ Can see all student documents              │
│  ├─ Can add/remove/modify documents            │
│  ├─ Can curate before sharing                  │
│  ├─ Can set expiry for shared links            │
│  └─ Has full audit trail access                │
│                                                  │
│  Bank:                                          │
│  ├─ Can only see shared documents              │
│  ├─ Access link expires after set date         │
│  ├─ Cannot download beyond expiry              │
│  ├─ Can review and update loan status          │
│  └─ Access is logged for audit                 │
│                                                  │
│  Admin:                                         │
│  ├─ Can see everything                         │
│  ├─ Can override/revoke access                 │
│  ├─ Can view all audit logs                    │
│  └─ Can manage system settings                 │
│                                                  │
└─────────────────────────────────────────────────┘
```

## File Dependencies

```
staff/dashboard/page.tsx
├─ Import: DocumentTransferCenter
├─ Import: DashboardContext (via Provider)
├─ Use: staffProfileApi
├─ Use: format (date-fns)
└─ Export: Full staff dashboard

DocumentTransferCenter.tsx
├─ Import: staffProfileApi
├─ Import: DocumentFlowTracker
├─ Use: useState, useEffect, useCallback
└─ Export: Complete document transfer interface

DocumentFlowTracker.tsx
├─ Use: useState, useEffect
└─ Export: Visual pipeline component

DashboardContext.tsx
├─ Use: createContext, useState, useCallback
└─ Export: DashboardProvider, useDashboard hook

useDashboardSync.ts
├─ Import: staffProfileApi
├─ Use: useCallback, useEffect, useState
└─ Export: 4 custom hooks

CrossPortalDataDashboard.tsx
└─ Export: Data comparison component
```

---

This architecture enables seamless document transfer with:
- ✅ Real-time synchronization
- ✅ Secure access control
- ✅ Complete audit trails
- ✅ Cross-portal communication
- ✅ Scalable design

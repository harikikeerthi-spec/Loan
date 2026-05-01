# Staff Dashboard Dynamic Document Transfer System - Implementation Guide

## Overview

The staff dashboard has been transformed into a **dynamic document transfer intermediary** between students and banks. This system enables seamless document management with real-time tracking and visualization.

## Architecture

### Three-Portal Flow

```
┌─────────────────┐
│  STUDENT        │
│  - Uploads      │
│  - Documents    │
└────────┬────────┘
         │ (Raw Documents)
         ▼
┌─────────────────────────────────────────┐
│  STAFF (NEW!)                           │
│  - Receives Documents                   │
│  - Reviews & Manages                    │
│  - Selects for Bank                     │
│  - Shares with Bank                     │
│  - Tracks History                       │
└────────┬────────────────────────────────┘
         │ (Curated Documents)
         ▼
┌─────────────────┐
│  BANK           │
│  - Accesses     │
│  - Reviews      │
│  - Updates Apps │
└─────────────────┘
```

## New Components

### 1. **DocumentTransferCenter** (`frontend/components/staff/DocumentTransferCenter.tsx`)

Main interface for document transfer management with two views:

#### Dashboard View
- **Profiles Table**: Shows all applicant profiles
- **Quick Stats**: Total docs, pending, shared, expired
- **Filters**: Search by name, filter by bank
- **Actions**: Manage documents for each profile

#### Profile View
- **Document Management**:
  - Upload new documents manually
  - Sync documents from student
  - Update document status
  - Remove documents
- **Document Sharing**:
  - Select documents to share
  - Input bank details
  - Set expiry duration
  - Add access notes
- **Share History**: View all document distributions

### 2. **DocumentFlowTracker** (`frontend/components/staff/DocumentFlowTracker.tsx`)

Visual pipeline showing real-time document flow:
- **Three Stages**: Student → Staff → Bank
- **Animated Flow**: Visual indicators for transfer progress
- **Real-time Stats**: Document counts at each stage
- **Status Indicators**: Pending, In Progress, Completed

### 3. **DashboardContext** (`frontend/contexts/DashboardContext.tsx`)

Shared state management for cross-portal communication:

```typescript
interface DashboardContextType {
  // Document sharing state
  sharedDocuments: DocumentShare[];
  addDocumentShare(): void;
  removeDocumentShare(): void;
  updateDocumentShare(): void;

  // Notifications
  notifications: Notification[];
  addNotification(): void;
  removeNotification(): void;

  // Refresh triggers
  triggerProfileRefresh(): void;
  triggerBankRefresh(): void;
  triggerStudentRefresh(): void;

  // Portal tracking
  currentPortal: 'student' | 'staff' | 'bank' | 'admin';
  setCurrentPortal(): void;
}
```

### 4. **useDashboardSync Hooks** (`frontend/hooks/useDashboardSync.ts`)

Custom hooks for data synchronization:

- **`useProfileDocumentTransfer(profileId)`**: Fetch and monitor profile with auto-refresh
- **`useDocumentShareTracking(profileId)`**: Track share distribution
- **`useBulkDocumentOps(profileId)`**: Batch operations on documents
- **`useDashboardSync(enabled)`**: Real-time sync enablement

## Key Features

### ✅ Real-time Document Transfer
- Auto-sync every 30 seconds
- Manual sync on demand
- Immediate status updates

### ✅ Dynamic Document Management
- Upload documents manually
- Update document statuses
- Batch operations support
- Remove documents

### ✅ Bank Sharing System
- Select specific documents
- Choose target bank
- Set access expiry
- Add access notes
- Generate share links

### ✅ Comprehensive Tracking
- Share history by profile
- Status tracking per document
- Activity timestamps
- Bank communication logs

### ✅ Visual Pipeline
- Animated flow diagram
- Real-time stage indicators
- Progress visualization
- Statistics dashboard

## Integration Steps

### Step 1: Add DashboardProvider to Root Layout

**File**: `frontend/app/layout.tsx`

```typescript
import { DashboardProvider } from '@/contexts/DashboardContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DashboardProvider>
          {/* Your existing providers */}
          {children}
        </DashboardProvider>
      </body>
    </html>
  );
}
```

### Step 2: Use in Student Dashboard

**File**: `frontend/app/(protected)/dashboard/page.tsx`

```typescript
import { useDashboard } from '@/contexts/DashboardContext';
import { useProfileDocumentTransfer } from '@/hooks/useDashboardSync';

export default function StudentDashboard() {
  const { addNotification, triggerProfileRefresh } = useDashboard();
  const { data, refresh } = useProfileDocumentTransfer(profileId);

  const handleUploadSuccess = () => {
    addNotification({
      type: 'upload_success',
      message: 'Document uploaded successfully!'
    });
    refresh();
    triggerProfileRefresh();
  };

  return (
    // Your dashboard JSX
  );
}
```

### Step 3: Use in Bank Dashboard

**File**: `frontend/app/bank/dashboard/page.tsx`

```typescript
import { useDashboard } from '@/contexts/DashboardContext';
import { useDocumentShareTracking } from '@/hooks/useDashboardSync';

export default function BankDashboard() {
  const { sharedDocuments } = useDashboard();
  const { shares } = useDocumentShareTracking(profileId);

  return (
    // Display shared documents and shares
  );
}
```

## Usage Examples

### Example 1: Share Documents with Bank

```typescript
const handleShareWithBank = async () => {
  const result = await staffProfileApi.shareWithBank(profileId, {
    doc_ids: ['doc1', 'doc2', 'doc3'],
    bank_name: 'HDFC Bank',
    bank_email: 'hdfc@example.com',
    expires_in_days: 7,
    access_note: 'Education loan documents for processing'
  });

  // Add notification
  addNotification({
    type: 'document_shared',
    message: `Documents shared with ${result.bank_name}`
  });

  // Refresh all portals
  triggerBankRefresh();
  triggerStudentRefresh();
};
```

### Example 2: Bulk Update Document Status

```typescript
const { updateMultipleStatus } = useBulkDocumentOps(profileId);

const handleBulkApprove = async (documentIds: string[]) => {
  await updateMultipleStatus(documentIds, 'approved');
  
  addNotification({
    type: 'bulk_update',
    message: `${documentIds.length} documents approved`
  });
};
```

### Example 3: Auto-sync Documents

```typescript
const { refresh } = useProfileDocumentTransfer(profileId);

// Automatically fetch new documents from student every 30 seconds
useEffect(() => {
  const interval = setInterval(refresh, 30000);
  return () => clearInterval(interval);
}, [refresh]);
```

## Database / API Enhancements Needed

### 1. Staff Profile Document Tracking
Ensure the backend tracks:
- Document upload source (student vs staff manual)
- Document status history
- Share metadata (bank, date, expiry)
- Access logs

### 2. Notification System
Add notifications for:
- New document uploads
- Document status changes
- Share expiry warnings
- Bank access logs

### 3. Audit Logs
Track:
- Document movement between portals
- Status changes with timestamps
- Share creation/expiry
- Bank access events

## Features Available Now

✅ **Document Transfer Center** - Main hub for intermediary operations
✅ **DocumentFlowTracker** - Visual pipeline
✅ **Real-time Sync** - Auto-refresh every 30 seconds
✅ **Document Management** - Upload, update, remove
✅ **Bank Sharing** - Batch share with expiry
✅ **Share History** - Complete audit trail
✅ **Status Tracking** - Pending to Approved flow
✅ **Search & Filter** - Find profiles and banks

## Features to Implement (Optional Enhancements)

🔄 **Real-time Notifications** - WebSocket for live updates
📄 **Document Preview** - View documents before sharing
📊 **Advanced Analytics** - Dashboard metrics and trends
🔐 **Access Control** - Granular permissions per bank
📱 **Mobile Optimization** - Responsive design improvements
🔗 **Deep Linking** - Direct links to specific transfers
📨 **Email Notifications** - Automated alerts for banks
⏱️ **SLA Tracking** - Monitor processing times

## Testing the System

### 1. Staff Dashboard Navigation
- Go to Staff Dashboard
- Click "Document Transfer" in sidebar
- View dashboard with flow tracker

### 2. Create Profile
- Click "Create Profile" button
- Select student and target bank
- Set loan type

### 3. Manage Documents
- Click "Manage" on a profile
- Upload documents
- Update statuses
- Share with bank

### 4. Monitor Flow
- Watch DocumentFlowTracker update
- See stats change in real-time
- View share history

## Performance Considerations

- **Auto-refresh**: 30-second intervals (configurable)
- **Share history**: 60-second poll interval
- **Query optimization**: Use pagination for large lists
- **Caching**: Implement profile caching in context
- **Batch operations**: Group API calls when possible

## Troubleshooting

**Documents not syncing?**
- Check student has uploaded documents
- Verify staff profile linked to student
- Check API permissions

**Share not appearing in bank?**
- Confirm share link validity
- Check bank email is correct
- Verify documents not expired

**Stats not updating?**
- Check auto-refresh is enabled
- Try manual refresh
- Check API responses

## File Structure

```
frontend/
├── components/
│   └── staff/
│       ├── DocumentTransferCenter.tsx      (NEW)
│       ├── DocumentFlowTracker.tsx         (NEW)
│       └── ApplicantsSection.tsx           (kept for reference)
├── contexts/
│   └── DashboardContext.tsx                (NEW)
├── hooks/
│   └── useDashboardSync.ts                 (NEW)
└── app/
    └── staff/
        └── dashboard/
            └── page.tsx                     (UPDATED)
```

## Summary

The staff dashboard is now a **dynamic intermediary hub** that:
1. ✅ Receives documents from students
2. ✅ Manages and reviews documents
3. ✅ Shares selected documents with banks
4. ✅ Tracks all transfers in real-time
5. ✅ Provides visual flow tracking
6. ✅ Enables cross-portal communication

This creates a seamless, efficient document transfer pipeline that was previously manual and disconnected.

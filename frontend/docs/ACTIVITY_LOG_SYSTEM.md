# Staff Dashboard Activity Log System

This document explains how the dynamic activity logging system works in the staff dashboard.

## Overview

The activity log system tracks all important staff actions and makes them visible in real-time on the dashboard. Activities are logged to the backend database and can be persisted for auditing purposes.

## Components

### 1. Backend Activity Logging

**Location**: `server/src/staff-profile/staff-profile.service.ts`

- `logDashboardActivity()` - Logs an activity to the AuditLog table
- `getDashboardActivities()` - Retrieves recent activities (sidebar widget)
- `getAllDashboardActivities()` - Retrieves paginated, filterable activities (full activity log page)

Activities are stored in the `AuditLog` table with the action type `STAFF_ACTIVITY`.

### 2. Frontend Utilities

#### `useActivityLog` Hook

Located in `frontend/hooks/useActivityLog.ts`

Provides real-time activity fetching with auto-refresh polling.

**Usage:**

```typescript
import { useActivityLog } from '@/hooks/useActivityLog';

export function MyComponent() {
  const { activities, loading, logActivity, addActivityOptimistic } = useActivityLog({
    limit: 15,
    pollInterval: 30000, // 30 seconds
    autoRefresh: true
  });

  return (
    <div>
      {activities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

#### `ActivityLogger` Utility

Located in `frontend/lib/activityLogger.ts`

Singleton class that provides typed methods for logging activities and notifying subscribers.

**Usage:**

```typescript
import { activityLogger } from '@/lib/activityLogger';

// Log document upload
await activityLogger.logDocumentUpload('PASSPORT_SCAN', 'John Doe');

// Log share with bank
await activityLogger.logShareWithBank(3, 'ICICI Bank', 'ops@icici.com');

// Log application status change
await activityLogger.logApplicationStatusChange('APP-12345', 'approved', 'John Doe');
```

**Available Methods:**

- `logProfileCreation(firstName, lastName, bank?)`
- `logDocumentUpload(docType, userName)`
- `logDocumentRemoval(docType, userName)`
- `logShareWithBank(docCount, bankName, bankEmail)`
- `logDocumentStatusUpdate(docType, status, userName)`
- `logApplicationStatusChange(appId, status, userName?)`
- `logUserRegistration(firstName, lastName)`
- `logDataSync(itemName, details?)`
- `logUserLink(firstName, lastName)`
- `logCustom(type, message, icon, color, details?)`

### 3. API Integration

**Frontend API**: `frontend/lib/api.ts`

- `staffProfileApi.logActivity(data)` - POST to `/staff-profiles/activities`
- `staffProfileApi.getDashboardActivities(limit)` - GET `/staff-profiles/dashboard/activities`
- `staffProfileApi.getAllDashboardActivities(opts)` - GET `/staff-profiles/activities/all`

## Activity Types and Styling

Each activity has:
- **Type**: Categorizes the activity (new, update, upload, share, approved, rejected, etc.)
- **Icon**: Material Design icon name
- **Color**: Tailwind CSS classes for styling
- **Message**: Human-readable description

### Predefined Activity Types

```typescript
{
  NEW: 'new',           // Profile/User creation (emerald)
  UPDATE: 'update',     // Data/profile updates (blue)
  UPLOAD: 'upload',     // Document uploads (purple)
  SHARE: 'share',       // Share with bank (indigo)
  APPROVED: 'approved', // Approvals (emerald)
  REJECTED: 'rejected', // Rejections/deletions (rose)
  LINK: 'link',         // User linking (indigo)
  SYNC: 'sync',         // Data synchronization (emerald)
}
```

## Implementation Examples

### Example 1: ApplicantsSection Component

In `frontend/components/staff/ApplicantsSection.tsx`:

```typescript
import { staffProfileApi } from '@/lib/api';

const handleShare = async (e: React.FormEvent) => {
  // ... existing code ...
  
  const res = await staffProfileApi.shareWithBank(profile.id, {
    doc_ids: shareForm.selectedDocs,
    bank_name: shareForm.bank_name,
    bank_email: shareForm.bank_email,
  });

  // Log activity
  await staffProfileApi.logActivity({
    type: 'share',
    msg: `Shared ${docCount} document(s) with ${shareForm.bank_name}`,
    icon: 'share',
    color: 'text-indigo-600 bg-indigo-50'
  }).catch(console.error);
};
```

### Example 2: Using ActivityLogger in Dashboard

```typescript
import { activityLogger } from '@/lib/activityLogger';

const handleDocumentUpload = async (file, docType, userName) => {
  try {
    await staffProfileApi.uploadDocument(profileId, file, docType);
    
    // Log with ActivityLogger
    await activityLogger.logDocumentUpload(docType, userName);
  } catch (err) {
    console.error('Upload failed:', err);
  }
};
```

### Example 3: Using useActivityLog Hook

```typescript
import { useActivityLog } from '@/hooks/useActivityLog';

export function ActivityWidget() {
  const { activities, loading, logActivity } = useActivityLog({
    limit: 10,
    autoRefresh: true
  });

  const handleAction = async () => {
    // Perform action
    
    // Log activity
    await logActivity(
      'custom_type',
      'Action performed by staff',
      'check_circle',
      'text-emerald-600 bg-emerald-50'
    );
  };

  return (
    <div>
      {loading && <p>Loading activities...</p>}
      {activities.map(activity => (
        <div key={activity.id}>
          <span className="material-symbols-outlined">{activity.icon}</span>
          <p>{activity.msg}</p>
          <small>{activity.time}</small>
        </div>
      ))}
    </div>
  );
}
```

## Database Schema

Activities are stored in the `AuditLog` table:

```sql
CREATE TABLE AuditLog (
  id UUID PRIMARY KEY,
  action VARCHAR(255),         -- e.g., 'STAFF_ACTIVITY'
  entityType VARCHAR(255),     -- e.g., 'DASHBOARD'
  entityId VARCHAR(255),       -- Activity type (new, update, share, etc.)
  initiatedBy UUID REFERENCES users(id),
  changes JSONB,               -- {msg, icon, color, activityType, actorName}
  ipAddress INET,
  userAgent TEXT,
  createdAt TIMESTAMP,
  FOREIGN KEY (initiatedBy) REFERENCES users(id)
);
```

## Real-Time Updates

### Polling-Based Updates (Current)

The `useActivityLog` hook uses polling to fetch activities every 30 seconds by default.

### Future: WebSocket-Based Updates

The backend already emits events via NestJS EventEmitter:

```typescript
// In staff-profile.service.ts
this.eventEmitter.emit('dashboard.activity', {
  type, msg, icon, color, actorName, actorEmail, createdAt
});
```

To implement WebSocket updates:
1. Set up a Socket.IO client in the frontend
2. Listen for `dashboard.activity` events
3. Update the activities state in real-time

## Best Practices

1. **Always log important actions**: User creates profile, documents uploaded/shared, status changes, etc.
2. **Use ActivityLogger methods**: Use the typed methods instead of calling `staffProfileApi.logActivity` directly
3. **Include context**: Log who did the action and what was affected
4. **Handle errors gracefully**: Activity logging failures shouldn't break the main action
5. **Keep messages concise**: Activities should be scannable in a list view
6. **Use consistent formatting**: Document types should be human-readable ("Passport Scan" not "PASSPORT_SCAN")

## Testing

To test the activity log system:

1. Open the staff dashboard
2. Perform actions like:
   - Creating a new applicant profile
   - Uploading documents
   - Sharing documents with a bank
   - Updating document status
3. Check the activity sidebar widget to see if activities appear
4. Check the database for entries in the `AuditLog` table

## Troubleshooting

### Activities not appearing

1. Check that `staffProfileApi.logActivity` is being called
2. Verify the backend is running and accessible
3. Check browser console for errors
4. Ensure the staff token is valid in localStorage

### Activities disappearing

1. Activities are queried fresh on each poll interval
2. Check that the backend is returning activities correctly
3. Verify that activities are being saved to the `AuditLog` table

### Performance issues

1. Reduce `pollInterval` in `useActivityLog` (default 30000ms)
2. Reduce `limit` parameter to fetch fewer activities
3. Consider implementing WebSocket for fewer network requests

## Future Enhancements

1. **Activity Filtering**: Filter by activity type, actor, date range
2. **Activity Export**: Export activity logs for compliance/auditing
3. **Real-time Notifications**: WebSocket-based real-time updates
4. **Activity Search**: Full-text search across all activities
5. **Activity Analytics**: Dashboard showing trends and patterns
6. **Role-Based Filtering**: Show only relevant activities based on staff role

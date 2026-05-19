# Dynamic Activity Log Implementation Guide

## Summary

The staff dashboard now has a fully dynamic activity logging system that tracks all important operations and provides real-time visibility into staff activities. Activities are persisted to the database and never deleted.

## What's Implemented

### ✅ Activity Logging for Key Operations

1. **Document Management**
   - Document uploads (logged)
   - Document removal/deletion (logged)
   - Document status updates (logged)
   - Document sharing with banks (logged)

2. **Profile Management**
   - Staff profile creation (logged)
   - User linking (logged)
   - Profile synchronization (logged)

3. **User Management**
   - New student registration (logged)
   - Profile data updates (logged)

### ✅ Real-Time Activity Display

- Activity widget in sidebar with polling-based updates (30-second intervals)
- Full activity log page with pagination and filtering
- Activities displayed with:
  - Actor name and email
  - Timestamp (formatted as relative time: "5m ago", "2h ago")
  - Action icon and color-coded visual indicators
  - Activity message describing what happened

### ✅ Backend Infrastructure

- AuditLog table stores all activities
- Activities use action type `STAFF_ACTIVITY` for easy filtering
- Event emitter available for future WebSocket integration
- Activity retrieval endpoints support pagination, filtering, and search

### ✅ Frontend Utilities

1. **useActivityLog Hook**
   - Auto-refresh polling with configurable intervals
   - Fetch activities with pagination
   - Log new activities
   - Subscribe to activity updates

2. **ActivityLogger Singleton**
   - Typed methods for common activity types
   - Consistent formatting and styling
   - Easy integration throughout codebase
   - Subscriber pattern for real-time updates

## Components Updated with Activity Logging

### 1. ApplicantsSection.tsx
- ✅ Document uploads
- ✅ Document deletion
- ✅ Document status updates
- ✅ Share with bank
- ✅ Profile creation

### 2. DocumentTransferCenter.tsx
- ✅ Share with bank
- ✅ Document removal

### 3. Dashboard (frontend/app/staff/dashboard/page.tsx)
- ✅ User registration
- ✅ Profile linking
- ✅ Profile synchronization
- ✅ Document uploads
- ✅ Data sharing
- And more...

## How It Works

### Activity Flow

1. **Action Performed**: Staff member performs an action (e.g., uploads document)
2. **Log Activity**: Component calls `staffProfileApi.logActivity()` or uses `ActivityLogger`
3. **Backend Processing**: Backend logs to `AuditLog` table with timestamp
4. **Frontend Retrieval**: Activity hook polls every 30 seconds for new activities
5. **Display**: Activity appears in sidebar widget and activity log page
6. **Persistence**: Activity is stored forever in database (never deleted)

### Database Persistence

Activities are stored in the `AuditLog` table with:
- Unique ID
- Action type (STAFF_ACTIVITY)
- Changes data (msg, icon, color, activityType, actorName)
- Timestamp
- Actor information (who performed the action)
- IP address (if available)
- User agent (if available)

## Usage Examples

### Example 1: Logging Document Upload in a Component

```typescript
import { activityLogger } from '@/lib/activityLogger';

async function handleDocumentUpload(file: File, docType: string, userName: string) {
  try {
    // Upload the document
    await staffProfileApi.uploadDocument(profileId, file, docType);
    
    // Log the activity
    await activityLogger.logDocumentUpload(docType, userName);
    
    showNotification('Document uploaded successfully');
  } catch (error) {
    showError('Failed to upload document');
  }
}
```

### Example 2: Using the Activity Hook in a Component

```typescript
import { useActivityLog } from '@/hooks/useActivityLog';

export function ActivityDashboard() {
  const { 
    activities, 
    loading, 
    logActivity,
    addActivityOptimistic 
  } = useActivityLog({
    limit: 20,
    pollInterval: 30000,
    autoRefresh: true
  });

  const handleCustomAction = async () => {
    // Perform the action
    
    // Add optimistic activity (appears immediately in UI)
    addActivityOptimistic(
      'custom',
      'Custom action performed',
      'check_circle',
      'text-emerald-600 bg-emerald-50'
    );
  };

  return (
    <div>
      {loading && <Spinner />}
      {activities.map(activity => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

### Example 3: Direct API Usage

```typescript
import { staffProfileApi } from '@/lib/api';

// Log any custom activity
await staffProfileApi.logActivity({
  type: 'share',
  msg: 'Shared application with stakeholder',
  icon: 'share',
  color: 'text-indigo-600 bg-indigo-50'
});

// Retrieve recent activities
const recentActivities = await staffProfileApi.getDashboardActivities(15);

// Get paginated, filterable activities
const activities = await staffProfileApi.getAllDashboardActivities({
  limit: 50,
  offset: 0,
  type: 'share',
  search: 'Bank'
});
```

## Configuration

### Activity Log Hook Options

```typescript
const { activities } = useActivityLog({
  limit: 15,              // Number of activities to fetch (default: 15)
  pollInterval: 30000,    // Polling interval in ms (default: 30000)
  autoRefresh: true       // Enable auto-refresh (default: true)
});
```

### Activity Types (Predefined)

Available types for consistent logging:
- `new` - New profiles/users created (emerald icon)
- `update` - Data updated (blue icon)
- `upload` - Documents uploaded (purple icon)
- `share` - Shared with bank/stakeholders (indigo icon)
- `approved` - Approvals (emerald icon)
- `rejected` - Rejections/deletions (rose icon)
- `link` - User linking (indigo icon)
- `sync` - Data synchronization (emerald icon)

## Performance Considerations

### Polling Strategy
- Default poll interval: 30 seconds
- Can be adjusted in hook configuration
- Low database load: ~1 query per component every 30 seconds

### Future Optimization
- Implement WebSocket for real-time updates
- Reduce polling frequency
- Add activity caching on frontend
- Implement server-side pagination

## Testing the Activity Log

### Manual Testing Steps

1. **Open Staff Dashboard**
   - Navigate to `/staff/dashboard`

2. **Perform Activities**
   - Create a new applicant profile → Check activity log
   - Upload a document → Check activity log
   - Share documents with a bank → Check activity log
   - Update document status → Check activity log

3. **Verify Activity Details**
   - Timestamp should appear as relative time ("Just now", "5m ago")
   - Actor name should be the logged-in staff member
   - Message should clearly describe what happened
   - Icon and color should match the activity type

4. **Check Database**
   - Query `AuditLog` table
   - Verify activities are persisted with action='STAFF_ACTIVITY'
   - Verify changes JSON contains msg, icon, color, activityType, actorName

### Expected Results

- ✅ Activities appear in sidebar widget immediately or within 30 seconds
- ✅ Activities appear in full activity log page with pagination
- ✅ Activities persist in database (never deleted)
- ✅ Activities show correct actor and timestamp
- ✅ Activity log is searchable and filterable

## Troubleshooting

### Activities not appearing in UI

1. Check browser console for errors
2. Verify staff token is valid in localStorage
3. Check network requests to `/api/staff-profiles/dashboard/activities`
4. Ensure backend is running and database is accessible

### Activities not being saved to database

1. Check backend logs for errors
2. Verify AuditLog table exists and is accessible
3. Check that staffProfileApi.logActivity is being called
4. Verify user ID is correctly set in request

### Performance issues

1. Reduce poll interval: `pollInterval: 60000` (every 60 seconds)
2. Reduce activity limit: `limit: 10`
3. Disable auto-refresh if not needed: `autoRefresh: false`
4. Implement pagination to load fewer activities at once

## Future Enhancements

### Phase 2: Advanced Features
- [ ] Activity analytics dashboard
- [ ] Activity export (CSV/PDF)
- [ ] Advanced filtering (date range, actor, type)
- [ ] Real-time WebSocket updates
- [ ] Activity notifications for important actions
- [ ] Role-based activity visibility

### Phase 3: Compliance Features
- [ ] Compliance audit reports
- [ ] Activity retention policies
- [ ] Signed activity logs
- [ ] Activity archive/backup
- [ ] GDPR-compliant activity deletion

## File Structure

```
frontend/
├── hooks/
│   └── useActivityLog.ts              # Activity log hook
├── lib/
│   ├── api.ts                         # API endpoints
│   └── activityLogger.ts              # Activity logger utility
├── components/staff/
│   ├── ApplicantsSection.tsx          # Updated with logging
│   └── DocumentTransferCenter.tsx     # Updated with logging
├── app/staff/dashboard/
│   └── page.tsx                       # Updated with logging
└── docs/
    └── ACTIVITY_LOG_SYSTEM.md         # Documentation

server/
└── src/staff-profile/
    ├── staff-profile.service.ts       # Activity logging logic
    └── staff-profile.controller.ts    # Activity endpoints
```

## Summary of Changes

### Modified Files

1. **frontend/components/staff/ApplicantsSection.tsx**
   - Added activity logging for share, upload, delete, status update
   - Added activity logging for profile creation

2. **frontend/components/staff/DocumentTransferCenter.tsx**
   - Added activity logging for share and document removal

3. **frontend/app/staff/dashboard/page.tsx**
   - Already had activity logging for various operations

### New Files

1. **frontend/hooks/useActivityLog.ts**
   - Custom hook for managing activity log state and polling

2. **frontend/lib/activityLogger.ts**
   - Singleton utility for activity logging with typed methods

3. **frontend/docs/ACTIVITY_LOG_SYSTEM.md**
   - Comprehensive documentation

4. **ACTIVITY_LOG_IMPLEMENTATION.md** (this file)
   - Implementation guide and overview

## Conclusion

The activity log system is now fully implemented and ready for production use. All major staff operations are logged, activities are persisted to the database, and a real-time activity display widget is available on the dashboard.

The system is designed to be:
- **Non-invasive**: Activities are logged async without blocking operations
- **Scalable**: Polling-based with room for WebSocket upgrades
- **Persistent**: All activities are stored forever in the database
- **User-friendly**: Clear, concise activity messages with visual indicators
- **Extensible**: Easy to add new activity types and logging points

For questions or issues, refer to the ACTIVITY_LOG_SYSTEM.md documentation file.

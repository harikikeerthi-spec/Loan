## Activity Log & Share Profile Feature Integration Guide

### Overview
This implementation adds two key features to the VidyaLoans platform:
1. **Real-time Activity Log** - Shows staff dashboard activities with WebSocket support
2. **Share Complete Profile to Bank** - One-click feature to share applicant profiles with partner banks

### Architecture

#### Frontend Components

**1. ActivityLogWidget** (`frontend/components/staff/ActivityLogWidget.tsx`)
- Displays real-time staff activities on the dashboard
- WebSocket connection for live updates
- Automatic polling fallback (30s intervals)
- Supports activity types: new, update, upload, share, approved, rejected, link, sync

**2. ShareProfileToBankModal** (`frontend/components/staff/ShareProfileToBankModal.tsx`)
- Modal interface for selecting bank and sharing complete applicant profile
- Displays applicant summary and documents to be shared
- Bank selection from available loan products
- Loading states and success/error feedback

**3. BankDashboardActivity** (`frontend/components/bank/BankDashboardActivity.tsx`)
- Displays shared applications in bank dashboard
- Real-time updates via WebSocket
- Statistics cards showing application metrics
- Progress tracking for each shared application

**4. useActivityLog Hook** (`frontend/hooks/useActivityLog.ts`)
- Custom hook managing activity state and real-time updates
- WebSocket listener management
- Optimistic UI updates for new activities
- Configurable refresh intervals

#### Backend Integration Points

**Staff Profile Service** (`server/src/staff-profile/staff-profile.service.ts`)
- `shareProfile()` method - Complete implementation for sharing profiles
- Handles state machine transitions (pending → docs_received → staff_verified → submitted_to_bank)
- Creates LoanApplication records
- Sends notifications to bank users
- Logs audit trail via `logDashboardActivity()`

**Staff Profile Controller** (`server/src/staff-profile/staff-profile.controller.ts`)
- Endpoint: `POST /staff-profiles/share-profile/:studentId`
- Requires StaffGuard authentication
- Request body includes recipientType, recipientName, email, message, studentDetails

### Integration Steps

#### Step 1: Verify Backend Setup
```bash
# Check that these routes exist:
# - POST /staff-profiles/share-profile/:studentId
# - GET /staff-profiles/dashboard/activities
# - GET /staff-profiles/activities/all
# - POST /staff-profiles/activities
```

#### Step 2: Frontend Dashboard Integration
The staff dashboard now includes:
- Activity log widget in sidebar (if space available)
- "Share Complete Profile" button in applicant detail view
- Share profile modal triggered from applicant section
- Real-time activity updates via WebSocket

#### Step 3: Bank Dashboard Integration
Add the BankDashboardActivity component to bank dashboard:
```tsx
import BankDashboardActivity from "@/components/bank/BankDashboardActivity";

// In bank dashboard page
<BankDashboardActivity limit={20} />
```

### WebSocket Events

**Emitted Events (from Backend):**
- `staff_activity` - New staff activity logged
- `new_application_shared` - New application shared with bank
- `application_status_updated` - Application status changed

**Expected Event Payloads:**
```typescript
// staff_activity
{
  id: string;
  type: 'new' | 'update' | 'upload' | 'share' | 'approved' | 'rejected' | 'link' | 'sync';
  message: string;
  icon: string;
  color: string;
  staffName: string;
  timestamp: ISO8601;
}

// new_application_shared
{
  id: string;
  studentName: string;
  email: string;
  loanAmount: number;
  status: 'pending';
  bank: string;
  documents: number;
  sharedAt: ISO8601;
}

// application_status_updated
{
  applicationId: string;
  newStatus: string;
  progress: number;
}
```

### API Endpoints Required

**GET /staff-profiles/dashboard/activities**
- Query params: `limit` (default: 10)
- Returns: Array of activity objects with timestamps

**GET /staff-profiles/activities/all**
- Query params: `limit`, `offset`, `type`, `dateFrom`, `dateTo`
- Returns: Paginated activities list

**POST /staff-profiles/activities**
- Body: `{ type, message, icon, color }`
- Returns: Created activity object

**POST /staff-profiles/share-profile/:studentId**
- Body: `{ recipientType, recipientName, recipientEmail, message, studentDetails }`
- Returns: `{ shareId, token, url, expiresAt, documentsShared }`

**GET /loan-applications/incoming** (Bank dashboard)
- Returns: Array of shared applications for current bank user
- Query params: `limit`, `offset`

### Data Flow: Share Profile Feature

```
1. Staff clicks "Share Complete Profile" → Opens ShareProfileToBankModal
2. Staff selects bank and reviews applicant details
3. Click "Share Profile" → API call to POST /staff-profiles/share-profile/:studentId
4. Backend:
   - Creates StaffProfile record with targetBank
   - Fetches and attaches user documents
   - Creates StaffProfileShare record
   - Maps onboarding data to LoanApplication fields
   - Executes state machine: pending → docs_received → staff_verified → submitted_to_bank
   - Creates ApplicationStatusHistory entries
   - Logs activity: `type: 'share'`
   - Emits WebSocket event: `new_application_shared`
   - Sends notification to bank user
5. Bank dashboard receives WebSocket update
6. New application appears in BankDashboardActivity table
7. Activity log shows: "Shared profile with [bankName]"
```

### Configuration

#### Environment Variables
```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CHAT_URL=http://localhost:5000/chat

# Backend (default settings)
# WebSocket events enabled
# Activity logging to AuditLog table
```

#### Activity Log Widget Props
```typescript
interface ActivityLogWidgetProps {
  limit?: number;              // Default: 10
  refreshInterval?: number;    // Default: 30000 (ms)
  showFullLog?: boolean;        // Default: false
}
```

#### ShareProfileToBankModal Props
```typescript
interface ShareProfileToBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StaffProfile;
  studentDetails: StudentDetails;
  onSuccess?: (result: { shareId, token, url }) => void;
}
```

#### BankDashboardActivity Props
```typescript
interface BankDashboardActivityProps {
  bankId?: string;
  limit?: number;              // Default: 15
}
```

### Testing Checklist

#### Unit Tests
- [ ] ActivityLogWidget renders without crashing
- [ ] useActivityLog hook manages state correctly
- [ ] ShareProfileToBankModal fetches banks on mount
- [ ] BankDashboardActivity displays shared applications

#### Integration Tests
- [ ] WebSocket connection establishes successfully
- [ ] Real-time activity updates appear in activity log
- [ ] Share profile modal submits correct data
- [ ] Bank dashboard receives and displays shared applications
- [ ] Status updates propagate to bank dashboard in real-time

#### End-to-End Tests
1. **Full Share Flow:**
   - [ ] Create new applicant in staff dashboard
   - [ ] Upload all required documents
   - [ ] Click "Share Complete Profile"
   - [ ] Select bank and confirm share
   - [ ] Verify activity appears in activity log
   - [ ] Verify application appears in bank dashboard

2. **Real-time Updates:**
   - [ ] Multiple staff members onboarding simultaneously
   - [ ] Activity log updates without page refresh
   - [ ] Bank dashboard shows new applications within seconds
   - [ ] Status changes propagate in real-time

3. **Error Handling:**
   - [ ] Network failure during share - shows error message
   - [ ] Missing bank selection - prevents submission
   - [ ] WebSocket disconnection - falls back to polling
   - [ ] Invalid applicant data - displays validation errors

4. **Performance:**
   - [ ] Activity log loads within 500ms
   - [ ] Bank dashboard updates without lag
   - [ ] WebSocket doesn't spam events
   - [ ] Polling fallback triggers correctly after 30s inactivity

### Debugging

#### Check WebSocket Connection
```typescript
// In browser console
socket.io.engine.on('open', () => console.log('WebSocket connected'));
socket.on('connect', () => console.log('Socket.io connected'));
socket.on('disconnect', () => console.log('Socket.io disconnected'));
```

#### Verify Activity Logging
```bash
# Check backend logs for activity creation
grep -r "logDashboardActivity" server/src/

# Verify database
SELECT * FROM audit_log WHERE action = 'STAFF_ACTIVITY' ORDER BY created_at DESC LIMIT 10;
```

#### Monitor Events
```typescript
// In browser console
socket.on('staff_activity', (data) => console.log('Staff activity:', data));
socket.on('new_application_shared', (data) => console.log('New app shared:', data));
socket.on('application_status_updated', (data) => console.log('Status updated:', data));
```

### Performance Considerations

1. **Activity Log Limit**: Set `limit` prop to balance between data freshness and performance
2. **WebSocket Polling**: 30-second intervals prevent excessive network usage
3. **Database Queries**: Indexed on `created_at` and `type` fields for fast retrieval
4. **Frontend Rendering**: Uses Framer Motion for smooth animations without jank

### Security Notes

1. **Authentication**: All endpoints require staff/bank authentication via StaffGuard/BankGuard
2. **Data Privacy**: Shared profiles contain PII - ensure encryption in transit
3. **Rate Limiting**: Consider rate limiting on share endpoint to prevent abuse
4. **Audit Trail**: All actions logged in AuditLog for compliance

### Troubleshooting

**Activity log not updating:**
1. Check WebSocket connection in browser DevTools
2. Verify backend is emitting 'staff_activity' events
3. Check activity API endpoint returns data
4. Review CORS configuration if using different domain

**Share profile fails:**
1. Verify student ID is valid
2. Check bank selection is not empty
3. Confirm all required fields in studentDetails object
4. Check server logs for validation errors

**Bank dashboard not showing shared apps:**
1. Verify bank user is logged in with correct role
2. Check applications exist with matching bank name
3. Verify WebSocket connection to bank dashboard
4. Check API endpoint returns applications for bank

### Files Modified

1. `frontend/app/staff/dashboard/page.tsx` - Added imports and state for ShareProfileToBankModal
2. `frontend/components/staff/ApplicantsSection.tsx` - Added "Share Complete Profile" button
3. `frontend/components/staff/ActivityLogWidget.tsx` - **NEW** Real-time activity display
4. `frontend/components/staff/ShareProfileToBankModal.tsx` - **NEW** Share profile interface
5. `frontend/components/bank/BankDashboardActivity.tsx` - **NEW** Bank-side application display
6. `frontend/hooks/useActivityLog.ts` - Enhanced with WebSocket support

### Next Steps

1. Deploy components to staging environment
2. Run end-to-end testing with real bank partners
3. Monitor performance metrics in production
4. Gather feedback from staff and bank users
5. Implement suggested improvements

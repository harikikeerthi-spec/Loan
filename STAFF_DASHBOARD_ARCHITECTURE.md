# Staff Dashboard Architecture - Complete Overview

## Project Context
**Loan**: Sun Glade Education Loan Platform  
**Location**: `c:\Projects\Sun Glade\Loan`  
**Current Date**: June 22, 2026

---

## 1. MAIN PAGE STRUCTURE & LAYOUT

### Primary Entry Point
- **File**: [frontend/app/staff/dashboard/page.tsx](frontend/app/staff/dashboard/page.tsx) (~3,300 lines)
- **URL Route**: `/staff/dashboard`
- **Type**: Next.js Server Component with `"use client"` directive (client-side rendering)

### Layout Structure
```
staff-dashboard-shell (full-height container)
├── Sidebar Navigation (68px-280px collapsible)
│   ├── Navigation items with icons
│   ├── Active section highlighting
│   └── Notification badges
├── Main Content Area (staff-dashboard-body)
│   └── Dynamic content based on activeSection
└── Optional Modals & Overlays
```

### Main UI Components
1. **StatCard Component** - Dashboard metric display cards with:
   - Icon with color-coded background
   - Large metric value (42px font)
   - Trend indicators
   - Badges (e.g., "URGENT")
   - Loading skeleton states

2. **NavItem Component** - Navigation menu items with:
   - Icon (always visible)
   - Label (appears on hover/expanded)
   - Badge count for unread items
   - Active state styling

3. **TableHeader Component** - Consistent table header styling

---

## 2. KEY COMPONENTS & FEATURES

### Navigation Sections (13 total)
The dashboard has the following main sections controlled by `activeSection` state:

| Section | Route | Purpose | Icon |
|---------|-------|---------|------|
| overview | N/A | Dashboard home, KPIs, quick stats | dashboard |
| applicants | N/A | View & manage loan applicants | people |
| incoming_queue | N/A | Queue of applications pending processing | inbox |
| applications | N/A | Full application management table | assignment |
| tasks | N/A | Staff task management | checklist |
| performance | N/A | Staff performance metrics & analytics | trending_up |
| users | N/A | User management (students, banks, staff) | group |
| blogs | N/A | Content management (editorial pieces) | article |
| community | N/A | Community forum/discussions moderation | forum |
| communications | N/A | Email & messaging center | mail |
| chat_customer | N/A | Real-time chat with customers | chat |
| my_profile | N/A | Staff member's own profile | person |
| onboarding | N/A | Applicant registration & KYC flow | person_add |

### Component Imports
**Location**: [frontend/components/staff/](frontend/components/staff/)

| Component | File | Purpose |
|-----------|------|---------|
| ApplicantsSection | `ApplicantsSection.tsx` | Displays applicant list with filters |
| ApplicationDetailView | `ApplicationDetailView.tsx` | Full application review sidebar (right panel) |
| ActivityLogWidget | `ActivityLogWidget.tsx` | Recent activity feed with auto-updating timestamps |
| NotificationsPanel | `NotificationsPanel.tsx` | Real-time notification bell with Socket.io integration |
| ShareProfileToBankModal | `ShareProfileToBankModal.tsx` | Dialog for sharing student profiles with banks |
| SendEmailModal | `SendEmailModal.tsx` | Email composition & sending interface |
| PullDocumentsModal | `PullDocumentsModal.tsx` | Modal for fetching documents from external sources |
| SendDocumentToBankModal | `SendDocumentToBankModal.tsx` | Document transfer to bank interface |
| DocumentTransferCenter | `DocumentTransferCenter.tsx` | Central hub for document exchanges |
| DocumentFlowTracker | `DocumentFlowTracker.tsx` | Visual tracker of document movement |
| KycSystemDashboard | `KycSystemDashboard.tsx` | KYC verification status & management |
| OCRDataComparisonModal | `OCRDataComparisonModal.tsx` | Compare OCR extracted data with profile |
| CrossPortalDataDashboard | `CrossPortalDataDashboard.tsx` | Cross-portal data synchronization view |
| StaffChatComponent | `StaffChatComponent.tsx` | Chat interface for customer support |

---

## 3. STATE MANAGEMENT

### Key State Variables
```typescript
// Section & Navigation
activeSection: 'overview' | 'applicants' | ... (13 options)
sidebarOpen: boolean
expandedSection: string | null

// Data Loading & Filtering
data: any[]
totalItems: number
currentPage: number
pageSize: number
searchQuery: string
filterStatus: string
filterCountry: string
filterPaymentPaid: boolean | null
visibleColumns: string[]

// UI Interactions
selectedApp: any | null
actionLoading: boolean
autoRefreshEnabled: boolean
lastRefresh: Date

// Onboarding Flow (Step 1-4)
onboardStep: number (1-4)
createdUser: any
newStudent: StudentProfile
quickForm: { firstName, lastName, email, phone }
onboardMode: 'new' | 'existing'

// Document Management
userDocuments: Document[]
ocrResults: Record<string, any>
uploadingDocs: Record<string, number> (upload progress)
uploadErrors: Record<string, string>

// Modal Controls
isEmailModalOpen: boolean
isUploadModalOpen: boolean
selectedDocType: string
isSharing: boolean

// Banks & Sharing
availableBanks: BankReference[]
bankUsers: User[]
shareTarget: 'bank' | 'student'
shareName: string
shareEmail: string
shareMessage: string
shareResult: ShareResult | null
```

### Data Hooks & Context
- **useAuth()** - Authentication context from [frontend/contexts/AuthContext.tsx](frontend/contexts/AuthContext.tsx)
- **useRouter()** - Next.js routing
- **useSearchParams()** - URL query parameters

---

## 4. BACKEND API INTEGRATION

### API Client Instances
Located in [frontend/lib/api.ts](frontend/lib/api.ts):

```typescript
adminApi          // Admin operations (users, applications, emails)
authApi           // Authentication & dashboard data
documentApi       // Document upload/download/management
onboardingApi     // Student onboarding & profile submission
staffProfileApi   // Staff-specific profiles & sharing
referenceApi      // Bank references & data
applicationApi    // Loan application CRUD
```

### Key API Endpoints Used

#### Overview/Dashboard Data
```
GET  /auth/dashboard              // Get dashboard statistics & KPIs
GET  /applications                // List all applications with filters
GET  /users                        // List users (pagination, filters)
GET  /blogs                        // List editorial content
```

#### Application Management
```
GET  /applications/:id            // Get single application details
PUT  /applications/:id            // Update application data
PUT  /applications/:id/status     // Change application status
GET  /applications/queue          // Get incoming applications queue
```

#### User Management
```
GET  /users/list                  // List users with role filtering
GET  /users/:id/profile           // Get user profile
POST /users/admin/create          // Create new user
PUT  /users/:id                   // Update user data
DELETE /users/:id                 // Delete user account
PUT  /users/make-admin            // Change user role (including staff)
```

#### Document Management
```
POST /documents/upload            // Upload document with OCR
GET  /documents/:userId           // Get user's documents
GET  /documents/:userId/presigned // Get presigned view URL
PUT  /documents/:userId/:docId/status  // Update document verification status
DELETE /documents/:userId/:docId  // Delete document
```

#### Onboarding & Profiles
```
POST /onboarding/submit           // Submit student profile
POST /onboarding/share            // Generate share link
GET  /staff-profiles/:userId      // Get staff profile
POST /staff-profiles              // Create staff profile
PUT  /staff-profiles/:id/shareProfile  // Share profile with bank
POST /staff-profiles/:id/documents    // Manage profile documents
```

#### Communications
```
POST /communications/send-email   // Send email to user
GET  /notifications               // Get notifications (Socket.io)
```

### Base URL Configuration
```
HTTP_API_PREFIX = "http://localhost:3001/api" (dev)
Or environment-based production URL
```

### API Paths Builder
**File**: [frontend/lib/http-api-paths.ts](frontend/lib/http-api-paths.ts)

Centralized REST path builders to keep staff dashboard and clients in sync:
```typescript
HttpApiPaths.applications.list()
HttpApiPaths.applications.byId(id)
HttpApiPaths.users.list()
HttpApiPaths.documents.upload(userId)
HttpApiPaths.documents.presignedView(userId, docType)
HttpApiPaths.staffProfiles.create()
HttpApiPaths.staffProfiles.shareProfile(profileId)
```

---

## 5. AUTHENTICATION & AUTHORIZATION

### Authentication Guard
**File**: [server/src/auth/staff.guard.ts](server/src/auth/staff.guard.ts)

**Class**: `StaffGuard` (NestJS CanActivate)

#### How It Works
1. Extracts JWT token from `Authorization: Bearer <token>` header or query parameter
2. Verifies token using JwtService
3. Looks up user in database by email from token payload
4. Checks if user role is in allowed roles:
   ```
   - staff
   - admin
   - super_admin
   - bank
   - partner_bank
   - support
   ```
5. Attaches user object to request if authorized
6. Throws UnauthorizedException or ForbiddenException if denied

#### Usage in Controllers
```typescript
@UseGuards(StaffGuard)
@Get('/staff-only-endpoint')
```

### Token Management (Frontend)
**File**: [frontend/lib/s3-utils.ts](frontend/lib/s3-utils.ts)

Tokens stored in localStorage:
```typescript
localStorage.getItem('staffAccessToken')
localStorage.getItem('adminAccessToken')
localStorage.getItem('accessToken')        // fallback
```

Used for authenticated API requests and S3 document operations.

### Role Hierarchy
| Role | Permissions | Notes |
|------|-------------|-------|
| super_admin | Full system access | Can create/delete users, change roles |
| admin | Administrative access | Can manage users, applications, staff |
| staff | Staff dashboard | Application review, document verification, student management |
| bank | Bank partner access | Can view applications sent to them, access student profiles |
| partner_bank | Partner bank access | Limited application access |
| support | Support team | Customer support access |
| student/user | Student dashboard | Own application & document access |
| agent | Agent partner | Application submission on behalf of students |

---

## 6. DATA FLOW ARCHITECTURE

### Real-Time Data Updates

#### WebSocket Integration (Socket.io)
**Files**: [frontend/components/staff/NotificationsPanel.tsx](frontend/components/staff/NotificationsPanel.tsx)
**Backend**: `server/src/chat/chat.gateway.ts`

```
Client connects to /chat namespace
├── Authenticates with JWT token
├── Joins room_staff (for all staff)
└── Listens for events:
    ├── notification_received
    ├── activity_updated
    └── application_changed
```

#### Notification Types
| Type | Icon | Color | Trigger |
|------|------|-------|---------|
| candidate_registered | person_add | Blue | New user signup |
| application_created | assignment | Indigo | New loan application |
| document_uploaded | description | Emerald | Student uploads document |
| application_submitted | send | Purple | Application submission |

**Backend Notification Flow**:
```
1. User Action (register/apply/upload)
   ↓
2. Service emits event (@EventEmitter)
   ├── Auth Service: candidate.registered
   ├── Application Service: application.created, document.uploaded
   └── Workflow Service: status_changed
   ↓
3. Notification Service listens (@OnEvent)
   ├── Checks notification recipients
   ├── Creates notification record in DB
   └── Broadcasts via Socket.io
   ↓
4. Socket.io Gateway (@WebSocketGateway)
   ├── Publishes to room_staff
   └── Client receives via listener
   ↓
5. Frontend UI Updates
   └── NotificationsPanel displays notification
```

### Data Polling & Auto-Refresh
```typescript
// Auto-refresh intervals by section
Overview:        20 seconds
Applications:    15 seconds
Incoming Queue:  15 seconds
Performance:     30 seconds
Users:           25 seconds
```

**Implementation**:
```typescript
useEffect(() => {
    if (!autoRefreshEnabled) return;
    autoRefreshInterval.current = setInterval(() => {
        loadData();        // API call
        setLastRefresh(new Date());
    }, INTERVAL);
    return () => clearInterval(autoRefreshInterval.current);
}, [activeSection, autoRefreshEnabled])
```

### Activity Logging
**File**: [frontend/lib/activityLogger.ts](frontend/lib/activityLogger.ts)

Centralized activity tracking:
```typescript
addActivity(
    type: 'new' | 'update' | 'upload' | 'share' | 'approved' | 'rejected' | 'link' | 'sync',
    message: string,
    icon: string,  // Material Icon name
    className: string  // Tailwind classes for styling
)
```

Called whenever staff takes an action:
- Register applicant
- Upload document
- Change application status
- Share profile with bank
- Etc.

**Persistence**: Activities sent to backend via `staffProfileApi.logActivity()`

---

## 7. APPLICANT ONBOARDING FLOW (4-Step Process)

### Step 1: Registration
- **Quick Register Form** or **Link Existing User**
- Creates new user with role='student'
- Triggers staff ID assignment if staff registration
- Creates initial StaffProfile record

### Step 2: Profile & Document Upload
- Personal details entry
- Identity document upload (PAN, Aadhaar, Passport)
- Automated OCR processing with field extraction
- Manual verification & correction UI
- Profile sync to database

### Step 3: Academic & Additional Documents
- Marksheet uploads (10th, 12th, UG, PG)
- Work experience entry
- Test scores (IELTS, TOEFL, GRE, etc.)
- Automatic field population from OCR

### Step 4: Bank Distribution
- Select target bank(s)
- Add recipient (bank representative email)
- Generate secure share link
- Create/update application record
- Mark application as "submitted_to_bank"

**Key Files**:
- Page rendering: [frontend/app/staff/dashboard/page.tsx](frontend/app/staff/dashboard/page.tsx) (lines 1000-3000)
- Database: Onboarding, StaffProfile, Document, User tables
- Backend: [server/src/onboarding/](server/src/onboarding/)

---

## 8. MAIN FEATURES & SECTIONS

### 🏠 Overview Dashboard
**Displays**:
- Application count breakdown (by status)
- Recent applicants (quick view)
- Performance metrics (success rate, avg processing time)
- Activity log widget (6 most recent activities with auto-updating timestamps)
- Quick action buttons
- System health indicators

**Data Sources**:
```
GET /auth/dashboard           // KPIs
GET /applications (limit 6)   // Recent applications
GET /audit-logs (limit 6)     // Activity log
```

### 👥 Applicants Section
**Displays**:
- Applicant list with search/filter
- Name, email, phone, registration date
- Linked applications count
- Action buttons (view profile, manage documents)

**Features**:
- Search by name/email
- Sort by registration date
- Pagination
- Bulk actions (if needed)

**Component**: [frontend/components/staff/ApplicantsSection.tsx](frontend/components/staff/ApplicantsSection.tsx)

### 📋 Incoming Queue
**Displays**:
- Applications waiting for staff action
- Status = 'pending', 'submitted', 'under_review'
- High-priority items highlighted (amber)
- Quick action menu (change status, send to bank, view details)

**Features**:
- Filter by status
- Search by application #, name, bank
- Sort by urgency/date
- Inline status change
- Bank assignment

**Backend Filter Logic**:
```
Exclude: "submitted", "pending", "draft", "docs_received", "staff_verified"
Include: Under review, queued, escalated
```

### 📊 Applications
**Full Table View**:
- All applications across all statuses
- Filters: Country, Payment status, Status, Stage
- Columns: App#, Student Name, Bank, Status, Progress %, Last Update
- Inline actions: View detail panel, change status, send email, delete

**Sorting**:
- By application number
- By student name
- By status/stage
- By created date

**Pagination**: 10 per page (configurable)

**Detail Panel**: [frontend/components/staff/ApplicationDetailView.tsx](frontend/components/staff/ApplicationDetailView.tsx)
- Full application data view
- Document status tracker
- Application timeline/history
- Edit remarks
- Change status with dropdown
- Send to bank
- Email applicant

### 📈 Performance Metrics
**Displays**:
- Application success rate (%)
- Average processing time (days)
- Document verification rate
- Staff workload distribution
- Time-series graphs (if available)

### 👤 Users Management
**Three Tabs**:
1. **All Users** - Total count, filters by role
2. **Breakdown by Role** - Statistics: Students, Bank Partners, Staff
3. **User List Table**
   - Columns: Email, Name, Role, Registration Date, Status
   - Actions: Edit, Change role, Delete, Send message
   - Bulk operations

**Special Handling for Staff**:
- Staff members have unique `staffId` (format: VL-SF-001, VL-SF-002...)
- Auto-assigned when user role changed to 'staff'
- See [memory/staff-id-implementation.md](../memories/repo/staff-id-implementation.md)

### 📝 Blogs/Editorial
**Displays**:
- List of blog posts/articles
- Status: Published or Draft
- View count
- Publication date

**Actions**:
- Publish/Unpublish
- Edit content
- Delete post
- View analytics

### 💬 Community Moderation
**Displays**:
- Forum topics/threads
- Discussion posts
- Active threads vs archived
- Moderation flags

**Actions**:
- Approve/remove posts
- Lock threads
- Flag spam

### 📧 Communications
**Email Center**:
- Compose emails to users
- Template library (if available)
- Bulk email option
- Recipient: Student, Bank, Agent, or Custom

**Features**:
- Rich text editor
- Attachments
- Scheduled send
- Delivery tracking

### 💬 Chat
**Customer Support Chat**:
- Real-time messaging with applicants
- Chat history
- Status indicators (online/offline)
- Typing indicators

**Integration**: Socket.io via ChatInterface component

### 👤 Staff Profile
- View own profile details
- Edit profile information
- View staff ID (VL-SF-XXX)
- Activity history
- Performance stats

---

## 9. KEY UTILITIES & HELPERS

### Document Management
**Files**: [frontend/lib/documentRequirements.ts](frontend/lib/documentRequirements.ts)

Functions:
```typescript
getPersonDocumentRequirements(student)      // Personal ID docs
getProfileDocumentRequirements(student)     // Profile/KYC docs
getStudentDocumentRequirements(student)     // Academic docs
```

Returns array of required documents with type, name, required flag.

### OCR & Field Normalization
**Files**:
- [frontend/lib/ocr-fields.ts](frontend/lib/ocr-fields.ts)
- [server/src/ai/utils/ocr-fields.util.ts](server/src/ai/utils/ocr-fields.util.ts)

Functions:
```typescript
normalizeOcrFieldsForAutofill(rawOcr, docType)  // Clean OCR output
normalizeGenderForForm(value)                    // M/F/Other
normalizeCountryName(value)                      // Country codes to names
parseOcrDateForInput(dateStr)                    // Date format conversion
normalizeStateName(value)                        // State abbreviations
```

### Validation Utilities
**File**: [frontend/lib/validation.ts](frontend/lib/validation.ts)

```typescript
formatPhone(phone)           // Format to XXX-XXXX-XXXX
formatAadhar(aadhar)         // Format to XXXX-XXXX-XXXX
formatPan(pan)               // Uppercase PAN
isPhoneValid(phone)          // 10-digit validation
isAadharValid(aadhar)        // 12-digit validation
isPanValid(pan)              // PAN format validation
```

### Location Data
**File**: [frontend/lib/countriesData.ts](frontend/lib/countriesData.ts)

```typescript
getAllCountries()            // Get list of countries
getStatesByCountry(country)  // Get states for given country
```

### Academic Date Inference
**File**: [frontend/lib/academic-ocr.ts](frontend/lib/academic-ocr.ts)

```typescript
examYearToEndDate(yearStr)   // Convert exam year to end date
inferStartDate(endDate, years)  // Infer start date from end date
```

---

## 10. THIRD-PARTY INTEGRATIONS

### Libraries & Packages
```
react              // UI framework
next               // React SSR framework
framer-motion      // Animations
date-fns           // Date handling
socket.io-client   // Real-time WebSocket
@nestjs/jwt        // JWT authentication
supabase-js        // Database client (if used)
```

### External Services
- **AWS S3** - Document storage (via presigned URLs)
- **Socket.io Server** - Real-time updates
- **OCR Engine** - Server-side document scanning
- **Email Service** - Email delivery

---

## 11. DIRECTORY STRUCTURE

```
frontend/
├── app/
│   ├── staff/
│   │   ├── dashboard/
│   │   │   └── page.tsx          (Main dashboard, 3,300+ lines)
│   │   ├── applications/
│   │   ├── users/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (protected)/
│   ├── (onboarding)/
│   └── globals.css               (Staff dashboard styling)
├── components/
│   └── staff/                     (14 staff-specific components)
│       ├── ApplicationDetailView.tsx
│       ├── ApplicantsSection.tsx
│       ├── ActivityLogWidget.tsx
│       ├── NotificationsPanel.tsx
│       ├── ChatComponent.tsx
│       └── ... (10 more)
├── contexts/
│   └── AuthContext.tsx            (Auth state management)
├── lib/
│   ├── api.ts                    (API client instance)
│   ├── http-api-paths.ts         (REST path builders)
│   ├── activityLogger.ts         (Activity logging)
│   ├── ocr-fields.ts             (OCR normalization)
│   ├── validation.ts             (Field validation)
│   ├── countriesData.ts          (Location data)
│   ├── documentRequirements.ts   (Doc requirements)
│   ├── academic-ocr.ts           (Academic date handling)
│   ├── s3-utils.ts               (S3 document ops)
│   └── ... (utilities)
└── types/
    └── ... (TypeScript definitions)

server/
├── src/
│   ├── auth/
│   │   ├── staff.guard.ts        (Staff authorization)
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── users.service.ts      (Staff ID generation)
│   │   └── users.controller.ts
│   ├── application/
│   │   ├── application.service.ts
│   │   └── application.controller.ts
│   ├── document/
│   │   ├── document.service.ts
│   │   └── document.controller.ts
│   ├── staff-profile/
│   │   ├── staff-profile.service.ts
│   │   ├── staff-profile.controller.ts
│   │   └── staff-profile.module.ts
│   ├── onboarding/
│   │   ├── onboarding.service.ts
│   │   └── onboarding.controller.ts
│   ├── notification/
│   │   ├── notification.service.ts
│   │   └── notification.listener (@OnEvent)
│   ├── chat/
│   │   └── chat.gateway.ts       (Socket.io gateway)
│   └── ... (other modules)
└── scripts/
    └── add-staff-id-column.sql   (DB migration)
```

---

## 12. AUTHENTICATION FLOW

```
1. Staff Login
   ├── POST /auth/login with email & password
   ├── Server generates JWT token (30min expiry)
   └── Returns: accessToken, refreshToken, user object

2. Token Storage (Frontend)
   ├── localStorage.setItem('staffAccessToken', token)
   ├── localStorage.setItem('refreshToken', refreshToken)
   └── Automatic refresh via refresh token

3. API Requests
   ├── Header: Authorization: Bearer <staffAccessToken>
   └── StaffGuard validates on backend

4. Route Protection
   ├── <ProtectedRoute> checks localStorage for token
   ├── Redirects to /login if missing/expired
   └── Allows navigation to /staff/dashboard if valid

5. Token Refresh
   ├── Auto-refresh on 401 response
   ├── GET /auth/refresh with refreshToken
   └── Returns new accessToken
```

---

## 13. FILE SIZE & COMPLEXITY

| File | Lines | Complexity | Purpose |
|------|-------|-----------|---------|
| [frontend/app/staff/dashboard/page.tsx](frontend/app/staff/dashboard/page.tsx) | 3,300+ | Very High | Main dashboard component |
| [frontend/components/staff/ApplicationDetailView.tsx](frontend/components/staff/ApplicationDetailView.tsx) | 1,200+ | High | Application detail panel |
| [server/src/auth/staff.guard.ts](server/src/auth/staff.guard.ts) | 78 | Low | Authorization guard |
| [server/src/application/application.service.ts](server/src/application/application.service.ts) | 1,500+ | Very High | Business logic |
| [frontend/lib/api.ts](frontend/lib/api.ts) | 1,400+ | High | API client |

---

## 14. PERFORMANCE CONSIDERATIONS

### Optimization Techniques
1. **Pagination** - 10 items per page, lazy load more
2. **Debounced Search** - Reduce API calls on typing
3. **Auto-refresh Intervals** - Configurable per section (15-30 sec)
4. **WebSocket** - Real-time updates instead of polling for notifications
5. **Memoization** - useMemo for expensive calculations
6. **Code Splitting** - Dynamic imports for modals/sections

### Database Indexes
**Files**: [server/scripts/](server/scripts/)

```sql
-- User table
idx_user_staffid           -- Fast staff ID lookups
idx_user_staffid_like      -- Pattern matching for VL-SF-%

-- Application table
idx_application_status     -- Filter by status
idx_application_userId     -- Filter by user
idx_application_bank       -- Filter by bank
```

---

## 15. STAFF ID SYSTEM

See [memory/staff-id-implementation.md](../memories/repo/staff-id-implementation.md)

**Format**: `VL-SF-{3-digit}` (e.g., VL-SF-001, VL-SF-002)

**Assignment**:
- Automatic when user role changed to 'staff'
- Unique sequential assignment
- Stored in User table `staffId` column

**Usage**:
- Staff identification in audit logs
- Activity attribution
- Dashboard personalization

---

## 16. RECENT IMPLEMENTATIONS (From Memory)

### ✅ Real-Time Notifications
- Candidate registration → Staff notification
- Application created → Staff notification
- Document uploaded → Staff notification
- Socket.io based, room_staff broadcast

### ✅ Activity Log Widget
- 6 most recent activities displayed
- Auto-updating timestamps (refresh every 10s)
- WebSocket + polling fallback
- Smooth Framer Motion animations
- Link to full audit trail

### ✅ Application ID Format Update
- New format standard for staff dashboard
- Consistent across all views

---

## 17. KNOWN LIMITATIONS & FUTURE WORK

### Current Limitations
- [ ] Bulk email operations (single recipient only)
- [ ] Notification preferences center
- [ ] Email digest for missed notifications
- [ ] Advanced filtering/saved views
- [ ] Document signed/encrypted transfer

### Planned Features
- [ ] Workflow automation (auto-status changes)
- [ ] Custom dashboard widgets
- [ ] Scheduled actions
- [ ] Batch document processing
- [ ] Advanced analytics dashboard
- [ ] Staff performance scorecards

---

## 18. QUICK START CHECKLIST

To understand the staff dashboard:

- [ ] Read main page: [frontend/app/staff/dashboard/page.tsx](frontend/app/staff/dashboard/page.tsx)
- [ ] Review staff components: [frontend/components/staff/](frontend/components/staff/)
- [ ] Check auth guard: [server/src/auth/staff.guard.ts](server/src/auth/staff.guard.ts)
- [ ] Understand API layer: [frontend/lib/api.ts](frontend/lib/api.ts)
- [ ] Review staff profile module: [server/src/staff-profile/](server/src/staff-profile/)
- [ ] Check application service: [server/src/application/application.service.ts](server/src/application/application.service.ts)
- [ ] Study onboarding flow: [frontend/app/staff/dashboard/page.tsx](frontend/app/staff/dashboard/page.tsx#L1000)

---

## 19. RELATED DOCUMENTATION

**Saved Implementation Notes**:
- [/memories/repo/staff-id-implementation.md](../memories/repo/staff-id-implementation.md) - Staff ID generation
- [/memories/repo/staff-dashboard-activity-log-widget.md](../memories/repo/staff-dashboard-activity-log-widget.md) - Activity logging
- [/memories/repo/staff-dashboard-real-time-notifications.md](../memories/repo/staff-dashboard-real-time-notifications.md) - Notifications
- [/memories/repo/bank-dashboard-integration-complete.md](../memories/repo/bank-dashboard-integration-complete.md) - Bank portal (related)

---

**Last Updated**: June 22, 2026  
**Status**: Complete & Current ✅

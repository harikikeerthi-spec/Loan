# Dynamic Dashboard Implementation Guide

## Overview
The dashboard has been transformed from a static, localStorage-based system to a dynamic, database-driven system. User-specific data (loan applications and documents) is now saved separately in the database for each user, ensuring data persistence and security.

## What Changed

### 1. **Database Schema (Prisma)**
Three new models have been added to store user-specific data:

#### `LoanApplication` Model
```prisma
model LoanApplication {
  id        String   @id @default(uuid())
  userId    String
  bank      String
  loanType  String   // education, home, personal, business, vehicle
  amount    Float
  purpose   String?
  status    String   @default("pending") // pending, processing, approved, rejected
  date      DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
}
```

#### `UserDocument` Model
```prisma
model UserDocument {
  id        String   @id @default(uuid())
  userId    String
  docType   String   // aadhar, pan, passport, 10th, 12th, degree
  uploaded  Boolean  @default(false)
  status    String   @default("pending") // pending, uploaded, verified, rejected
  filePath  String?
  uploadedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, docType])
  @@index([userId])
  @@index([docType])
}
```

### 2. **Backend API Endpoints**

#### Dashboard Data Endpoints
- **POST `/auth/dashboard-data`** - Get all applications and documents for a user
  - Request: `{ userId: string }`
  - Response: `{ success: boolean, data: { applications: [], documents: [] } }`

#### Loan Application Endpoints
- **POST `/auth/create-application`** - Create a new loan application
  - Request: `{ userId, bank, loanType, amount, purpose? }`
  - Response: `{ success: boolean, application: LoanApplication }`

- **POST `/auth/applications`** - Get user's applications
  - Request: `{ userId: string }`
  - Response: `{ success: boolean, applications: [] }`

- **POST `/auth/update-application/:id`** - Update application status
  - Request: `{ status: string }` (pending, processing, approved, rejected)
  - Response: `{ success: boolean, application: LoanApplication }`

- **DELETE `/auth/application/:id`** - Delete an application
  - Response: `{ success: boolean, message: string }`

#### Document Endpoints
- **POST `/auth/upload-document`** - Upload or update document status
  - Request: `{ userId, docType, uploaded, filePath? }`
  - Response: `{ success: boolean, document: UserDocument }`

- **POST `/auth/documents`** - Get user's documents
  - Request: `{ userId: string }`
  - Response: `{ success: boolean, documents: [] }`

- **DELETE `/auth/document/:userId/:docType`** - Delete a document
  - Response: `{ success: boolean, message: string }`

### 3. **Frontend Changes**

#### New Functions in `dashboard.js`
- **`loadDynamicDashboardData(userId)`** - Fetches user's applications and documents from the database
- **`convertDocumentsToFormat(dbDocuments)`** - Converts database document format to UI format
- **`createLoanApplicationAPI(bank, loanType, amount, purpose)`** - Creates a new application via API
- **`deleteApplicationAPI(appId, index)`** - Deletes an application via API
- **`uploadDocumentAPI(docType)`** - Uploads or marks a document as uploaded via API

#### Enhanced `loadUserDashboard()` Function
Now includes:
- Retrieval and storage of `userId` from the database
- Automatic loading of dynamic dashboard data after user authentication

#### Updated `dashboard.html`
- `deleteApplication()` function now calls `deleteApplicationAPI()` instead of localStorage only

### 4. **User Service Enhancements** (`users.service.ts`)

New methods added:
- `createLoanApplication()` - Create new loan application
- `getUserApplications()` - Fetch user's applications
- `updateLoanApplicationStatus()` - Update application status
- `deleteLoanApplication()` - Delete an application
- `upsertUserDocument()` - Create or update document
- `getUserDocuments()` - Fetch user's documents
- `deleteUserDocument()` - Delete a document
- `getUserDashboardData()` - Get complete dashboard data with applications and documents

## Data Flow

### 1. User Login
```
User logs in → JWT token generated → userId stored in localStorage
```

### 2. Dashboard Load
```
Dashboard page loads → 
  ↓
loadUserDashboard() called →
  ↓
Fetch user profile from API (email/firstName/lastName) →
  ↓
Store userId in localStorage →
  ↓
loadDynamicDashboardData(userId) called →
  ↓
Fetch applications and documents from database →
  ↓
Render dynamic dashboard
```

### 3. Create Application
```
User fills form → 
  ↓
createLoanApplicationAPI() called →
  ↓
POST to /auth/create-application →
  ↓
Application saved to database →
  ↓
Local dashboard updated and re-rendered
```

### 4. Delete Application
```
User clicks delete →
  ↓
deleteApplicationAPI() called →
  ↓
DELETE /auth/application/:id →
  ↓
Application removed from database →
  ↓
Local dashboard updated and re-rendered
```

## Migration Information

A Prisma migration was created and applied:
- **Migration file:** `20260129072840_add_loan_applications_and_documents`
- **Location:** `server/prisma/migrations/`

The migration:
1. Added `updatedAt` field to User model
2. Created `LoanApplication` table with proper indexes and relations
3. Created `UserDocument` table with composite unique constraint on `(userId, docType)`

## Key Features

### 1. **User Data Separation**
Each user's data is isolated using the `userId` foreign key:
- Applications are specific to each user
- Documents are specific to each user
- Data cannot be accessed by other users

### 2. **Data Persistence**
All data is saved in PostgreSQL database:
- Survives browser cache clearing
- Accessible across different devices
- Proper backup and recovery support

### 3. **Real-time Synchronization**
- Dashboard reflects database state immediately
- Changes propagate across tabs/windows (via API calls)
- LocalStorage used as cache only

### 4. **Security**
- JWT token required for all API calls
- User can only access their own data (enforced by userId)
- No sensitive data in localStorage beyond token

## Usage Examples

### Creating a Loan Application
```javascript
const success = await createLoanApplicationAPI(
    'HDFC Bank',
    'education',
    500000,
    'Engineering degree'
);
```

### Uploading a Document
```javascript
const success = await uploadDocumentAPI('aadhar');
// This marks Aadhar as uploaded in the database
```

### Loading Dashboard Data
```javascript
// Automatically called on page load
await loadDynamicDashboardData(userId);
```

## Backward Compatibility

### LocalStorage Still Used For:
- Access token
- User email
- User name (firstName, lastName)
- Phone number
- Date of birth

### Database Now Used For:
- **All user applications**
- **All document records**

This hybrid approach provides:
- Fast access to frequently used data (localStorage)
- Persistent storage for important records (database)
- Synchronization between client and server

## Next Steps / Future Enhancements

1. **File Upload Integration**
   - Implement actual file upload for documents
   - Store file paths in `UserDocument.filePath`

2. **Real-time Updates**
   - Implement WebSockets for live dashboard updates
   - Notify users of application status changes

3. **Document Verification**
   - Add admin panel for document verification
   - Update document status from admin dashboard

4. **Application History**
   - Track application updates with timestamps
   - Maintain audit trail of changes

5. **Data Export**
   - Allow users to export their applications as PDF
   - Generate application summaries

## Testing

### Test Endpoints Using cURL:

**Create Application:**
```bash
curl -X POST http://localhost:3000/auth/create-application \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user-id",
    "bank": "HDFC Bank",
    "loanType": "education",
    "amount": 500000,
    "purpose": "Engineering degree"
  }'
```

**Get Applications:**
```bash
curl -X POST http://localhost:3000/auth/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{ "userId": "user-id" }'
```

**Upload Document:**
```bash
curl -X POST http://localhost:3000/auth/upload-document \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user-id",
    "docType": "aadhar",
    "uploaded": true
  }'
```

## Troubleshooting

### Issue: 404 on new endpoints
- Ensure server has been restarted after schema changes
- Verify Prisma client was regenerated
- Check auth module imports

### Issue: Applications not loading
- Verify userId is stored in localStorage after login
- Check browser console for API errors
- Ensure JWT token is valid

### Issue: Data not persisting
- Check database connection in .env
- Verify migration ran successfully: `npx prisma migrate status`
- Check for database permission issues

## Files Modified

1. **Backend:**
   - `server/server/prisma/schema.prisma` - Added new models
   - `server/server/src/auth/auth.controller.ts` - Added new endpoints
   - `server/server/src/users/users.service.ts` - Added new methods

2. **Frontend:**
   - `web/assets/js/dashboard.js` - Added API integration functions
   - `web/dashboard.html` - Updated deleteApplication() function

3. **Database:**
   - `server/server/prisma/migrations/20260129072840_add_loan_applications_and_documents/`

## Support

For issues or questions:
1. Check application logs: `npm run start`
2. Verify database: `npx prisma studio`
3. Check browser DevTools for API errors
4. Review this documentation for similar issues

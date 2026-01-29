# Quick Reference - Dynamic Dashboard API

## 🚀 Quick Start

### 1. Restart Server
```bash
cd server/server
npm run start
```

### 2. Test Dashboard
- Login to application
- Check console for "Dashboard data loaded from database"
- Create a new application
- Refresh page - data persists ✅

## 📡 API Endpoints

### Dashboard
```
POST /auth/dashboard-data
Body: { userId: "string" }
Returns: { success: bool, data: { applications: [], documents: {} } }
```

### Applications
```
POST /auth/create-application
Body: { userId, bank, loanType, amount, purpose? }
Returns: { success: bool, application: {...} }

POST /auth/applications
Body: { userId }
Returns: { success: bool, applications: [...] }

POST /auth/update-application/:id
Body: { status: "pending|processing|approved|rejected" }
Returns: { success: bool, application: {...} }

DELETE /auth/application/:id
Returns: { success: bool, message: string }
```

### Documents
```
POST /auth/upload-document
Body: { userId, docType, uploaded: bool, filePath? }
Returns: { success: bool, document: {...} }

POST /auth/documents
Body: { userId }
Returns: { success: bool, documents: [...] }

DELETE /auth/document/:userId/:docType
Returns: { success: bool, message: string }
```

## 🎯 Frontend Functions

```javascript
// Load all dashboard data from DB
loadDynamicDashboardData(userId)

// Create new application
createLoanApplicationAPI(bank, loanType, amount, purpose)

// Delete application
deleteApplicationAPI(appId, index)

// Upload document
uploadDocumentAPI(docType)
```

## 📊 Database Schema

### LoanApplication
```
id: UUID
userId: string (FK to User)
bank: string
loanType: string
amount: float
purpose: string?
status: string (pending|processing|approved|rejected)
date: DateTime
updatedAt: DateTime
```

### UserDocument
```
id: UUID
userId: string (FK to User)
docType: string (aadhar|pan|passport|10th|12th|degree)
uploaded: boolean
status: string (pending|uploaded|verified|rejected)
filePath: string?
uploadedAt: DateTime?
createdAt: DateTime
updatedAt: DateTime
```

## 🔐 Authentication

All API calls require:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

Token stored in localStorage as `accessToken`

## 📝 Important Changes

| Area | Before | After |
|------|--------|-------|
| Storage | localStorage | PostgreSQL |
| Data Scope | Global | Per User |
| Persistence | Cache only | Permanent |
| Sync | Manual | Automatic |

## ✅ Verification Checklist

- [ ] Server restarted after schema changes
- [ ] Prisma migration applied successfully
- [ ] Dashboard loads without errors
- [ ] Applications persist after page refresh
- [ ] Each user sees only their data
- [ ] Delete application works
- [ ] Console shows no 404 errors

## 🐛 Common Issues

**404 on API endpoints**
- Restart server
- Clear browser cache
- Check console logs

**Data not loading**
- Verify userId in localStorage
- Check Network tab for API response
- Verify JWT token is valid

**Data not persisting**
- Check database connection
- Run `npx prisma migrate status`
- Use `npx prisma studio` to inspect

## 📂 Files Modified

1. `server/server/prisma/schema.prisma` - New models
2. `server/server/src/auth/auth.controller.ts` - 8 new endpoints
3. `server/server/src/users/users.service.ts` - 8 new methods
4. `web/assets/js/dashboard.js` - API integration
5. `web/dashboard.html` - Update delete function

## 🎓 Example Usage

### Create Application
```javascript
await createLoanApplicationAPI(
  'HDFC Bank',
  'education',
  500000,
  'Engineering degree'
);
```

### Upload Document
```javascript
await uploadDocumentAPI('aadhar');
```

### Load Dashboard
```javascript
await loadDynamicDashboardData(userId);
```

## 📈 Next Steps

1. Test all endpoints
2. Implement file upload
3. Add admin dashboard
4. Enable real-time updates
5. Add notifications

---

**Version:** 1.0  
**Status:** Ready for Testing  
**Last Updated:** January 29, 2026

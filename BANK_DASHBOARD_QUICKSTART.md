# Quick Start - Dynamic Bank Dashboard

## 🚀 Setup Checklist

### Phase 1: Database Setup
- [ ] Open terminal in `server` directory
- [ ] Run: `node migrate_bank_dashboard.js`
- [ ] Verify all tables created (check PostgreSQL)
- [ ] Check for any migration errors

### Phase 2: Backend Setup
- [ ] Ensure `BankDashboardService` is imported in `bank.module.ts`
- [ ] Ensure `BankDashboardController` is registered in `bank.module.ts`
- [ ] Run: `npm start:dev` in server directory
- [ ] Check logs for successful server start

### Phase 3: Frontend Setup
- [ ] Verify `NEXT_PUBLIC_API_URL` environment variable is set
- [ ] Component file exists: `frontend/components/bank/DynamicBankDashboard.tsx`
- [ ] API client exists: `frontend/lib/bank-dashboard-api.ts`
- [ ] Run: `npm run dev` in frontend directory

### Phase 4: Testing
- [ ] Test bank products endpoint
- [ ] Test file logging endpoint
- [ ] Test analytics endpoint
- [ ] Verify RBAC is working

---

## 📋 API Endpoint Quick Reference

### Configuration
```bash
# Get products
GET /api/bank/dashboard/products

# Add product
POST /api/bank/dashboard/products

# Get branches
GET /api/bank/dashboard/branches
```

### File Operations
```bash
# Log file with LAN
POST /api/bank/dashboard/files/:applicationId/log
{ "lanNumber": "VLAN-2026-001" }

# Get file by LAN
GET /api/bank/dashboard/files/by-lan/VLAN-2026-001
```

### ROI & Fees
```bash
# Set ROI
PUT /api/bank/dashboard/applications/:applicationId/roi
{ "roiType": "FLOATING", "roiBase": 8.2, "roiEffective": 9.5 }

# Set processing fee
POST /api/bank/dashboard/applications/:applicationId/processing-fee
{ "feeAmount": 10000 }

# Update fee status
PUT /api/bank/dashboard/applications/:applicationId/processing-fee
{ "status": "PAID", "details": { "paymentMode": "ONLINE", "paymentRef": "TXN123" } }
```

### Queries
```bash
# Raise query
POST /api/bank/dashboard/applications/:applicationId/query
{ "queryType": "DOCUMENT", "description": "Need salary slips" }

# Get queries
GET /api/bank/dashboard/queries?applicationId=:applicationId

# Respond to query
POST /api/bank/dashboard/queries/:queryId/response
{ "message": "Received documents" }

# Resolve query
PUT /api/bank/dashboard/queries/:queryId/resolve
```

### Disbursements
```bash
# Confirm disbursement
POST /api/bank/dashboard/applications/:applicationId/disbursement
{ "amount": 500000, "mode": "NEFT", "utrNumber": "123456", "beneficiary": "John" }

# Get disbursements
GET /api/bank/dashboard/applications/:applicationId/disbursements
```

### Analytics
```bash
# Channel analytics
GET /api/bank/dashboard/analytics/channel

# Rejection analysis
GET /api/bank/dashboard/analytics/rejections

# Pipeline view
GET /api/bank/dashboard/analytics/pipeline

# Aging report
GET /api/bank/dashboard/analytics/aging

# SLA metrics
GET /api/bank/dashboard/analytics/sla
```

### Quality & Audit
```bash
# Rate file quality
POST /api/bank/dashboard/applications/:applicationId/quality-rating
{ "completeness": 5, "accuracy": 4, "clarity": 5 }

# Get audit logs
GET /api/bank/dashboard/applications/:applicationId/audit-logs
```

---

## 🔑 Key Features

### For Bank Officers
✅ Log files & assign LAN numbers
✅ Set ROI & processing fees
✅ Make sanction/rejection decisions
✅ Track conditional sanctions with deadlines
✅ Manage queries and documents
✅ Confirm disbursements (tranches)
✅ Rate file quality
✅ View comprehensive analytics

### For Admin Users
✅ All bank officer features
✅ Configure bank products
✅ Manage bank branches
✅ Cross-bank analytics
✅ Full audit trail access

### For Staff (Limited Access)
✅ View own submitted files
❌ Cannot see: disbursements, commissions, other staff metrics

---

## 🧪 Test Scenario

1. **Create Application** (via existing flow)
2. **Log File**: `POST /api/bank/dashboard/files/{id}/log` with LAN
3. **Set ROI**: `PUT /api/bank/dashboard/applications/{id}/roi`
4. **Set Fee**: `POST /api/bank/dashboard/applications/{id}/processing-fee`
5. **Raise Query**: `POST /api/bank/dashboard/applications/{id}/query` (if needed)
6. **Create Decision**: Via existing decision endpoints
7. **Confirm Disbursement**: `POST /api/bank/dashboard/applications/{id}/disbursement`
8. **Rate Quality**: `POST /api/bank/dashboard/applications/{id}/quality-rating`
9. **View Analytics**: `GET /api/bank/dashboard/analytics/*`
10. **Check Audit**: `GET /api/bank/dashboard/applications/{id}/audit-logs`

---

## 🐛 Troubleshooting

### Migration Fails
- Check PostgreSQL connection string in `.env`
- Verify `DIRECT_URL` is set correctly
- Check database credentials

### API Returns 401
- Verify `Authorization` header with valid JWT token
- Check user role has correct permissions

### API Returns 400
- Verify request body format matches examples
- Check all required fields are provided
- Validate data types (amounts as numbers, dates as ISO 8601)

### Analytics Empty
- Ensure applications exist in database
- Check bank ID is correctly resolved
- Verify `x-bank-id` header is set

---

## 📊 Database Schema Summary

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| BankProduct | Loan products | roiMin, roiMax, maxAmount |
| BankBranch | Branch info | branchCode, coverageAreas |
| BankDecision | Decisions | decision type, sanctionAmount, tenure |
| ProcessingFee | Fees | feeAmount, status, paymentRef |
| Disbursement | Payouts | trancheNumber, utrNumber, amount |
| BankQuery | Clarifications | queryType, status, resolvedAt |
| QueryResponse | Query answers | message, attachments |
| FileQualityRating | Quality scores | completeness, accuracy, clarity |
| ConsentRecord | VLCON tracking | consentId, validTill |
| AuditLog | Audit trail | action, performedBy, role |
| ReferralFee | Commissions | feeType, feeAmount, invoiceStatus |

---

## 🔐 Role-Based Access

### BANK_OFFICER
- All read/write permissions
- Access to all fields

### ADMIN
- All read/write permissions
- Cross-bank visibility
- Full audit access

### STAFF
- Read own applications
- Hidden: disbursements, commissions, utrNumber, creditScore

---

## 📞 Support

For issues:
1. Check `AuditLog` table for operation history
2. Review API response error details
3. Verify database migrations completed
4. Check role-based permissions
5. Review console logs in backend

---

## 📚 Full Documentation

See `BANK_DASHBOARD_GUIDE.md` for comprehensive documentation including:
- Complete API reference
- Database schema details
- Frontend component guide
- Usage examples
- Advanced features

---

**Status**: ✅ Fully Implemented
**Last Updated**: May 21, 2026
**Version**: 1.0.0

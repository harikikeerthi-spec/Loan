# Loan Application API Reference

This document outlines the robust Application API endpoints implemented in `ApplicationController`. 

> **Note**: The frontend (`apply-loan.html`) currently uses a simplified legacy endpoint (`/auth/create-application`). To utilize the full features (stage tracking, document requirements, detailed user info), the frontend should be updated to use the endpoints below.

## Base URL
`/applications`

## Endpoints

### 1. Create Application
Create a new loan application with full details.

- **URL**: `POST /applications`
- **Auth**: Required (`Bearer <token>`)
- **Body**:
  ```json
  {
    "bank": "SBI",
    "loanType": "education",
    "amount": 500000,
    "purpose": "MS in CS",
    "tenure": 24,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "dateOfBirth": "1999-01-01",
    "gender": "male",
    "nationality": "Indian",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "employmentType": "student",
    "universityName": "Northeastern University",
    "courseName": "Computer Science",
    "courseDuration": 24,
    "courseStartDate": "2026-09-01",
    "admissionStatus": "confirmed",
    "hasCoApplicant": true,
    "coApplicantName": "Jane Doe",
    "coApplicantRelation": "Mother",
    "coApplicantIncome": 1200000
  }
  ```
- **Response**: Returns created application object with `applicationNumber`.

### 2. View My Applications
Get a paginated list of the logged-in user's applications.

- **URL**: `GET /applications/my`
- **Auth**: Required
- **Query Params**:
  - `status`: Filter by status (e.g., `draft`, `submitted`, `approved`)
  - `loanType`: Filter by type
  - `limit`: items per page (default 20)
  - `offset`: skip items
- **Response**: `{ success: true, data: [...], pagination: {...} }`

### 3. View Application Details
Get full details of a specific application.

- **URL**: `GET /applications/:id`
- **Auth**: Required
- **Response**: Full application object including status history and notes.

### 4. Track Application (Public)
Track status using the application number (no login required).

- **URL**: `GET /applications/track/:applicationNumber`
- **Auth**: None
- **Response**: Current stage, progress percentage, and timeline.

### 5. Document Management
Manage documents for a specific application.

- **Get Required Documents**: `GET /applications/required-documents/:loanType`
- **Upload Document**: `POST /applications/:id/documents` (Multipart/form-data)
  - Fields: `file`, `docType`, `docName`
- **View Documents**: `GET /applications/:id/documents`

### 6. Admin Operations
Endpoints for admin dashboard.

- **List All**: `GET /applications/admin/all`
- **Update Status**: `PUT /applications/admin/:id/status`
- **Verify Document**: `PUT /applications/admin/documents/:documentId/verify`
- **Metrics**: `GET /applications/admin/stats`

## Database Schema (Prisma)
The backend uses the `LoanApplication` model which supports all the fields listed in the "Create Application" body above.

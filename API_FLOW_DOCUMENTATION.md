# Unified Authentication API Flow

## Overview
The authentication system now uses a unified OTP-based flow that works for both new and existing users.

## API Endpoints

### 1. Send OTP
**Endpoint:** `POST /auth/send-otp`

**Request:**
```json
{
  "email": "john.doe.email@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "userExists": false
}
```

**Notes:**
- `userExists: true` = User already registered
- `userExists: false` = New user

---

### 2. Verify OTP
**Endpoint:** `POST /auth/verify-otp`

**Request:**
```json
{
  "email": "john.doe.email@example.com",
  "otp": "123456"
}
```

**Response (New User):**
```json
{
  "success": true,
  "message": "Signup successful. Please complete your profile.",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userExists": false,
  "hasUserDetails": false,
  "firstName": null,
  "lastName": null
}
```

**Response (Existing User with Details):**
```json
{
  "success": true,
  "message": "Login successful.",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userExists": true,
  "hasUserDetails": true,
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (Existing User without Details):**
```json
{
  "success": true,
  "message": "Login successful.",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userExists": true,
  "hasUserDetails": false,
  "firstName": null,
  "lastName": null
}
```

---

## Frontend Navigation Flow

Based on the OTP verification response, the frontend should handle navigation as follows:

### Case 1: New User (userExists = false)
```
Step 1: User enters email
        ↓
Step 2: User enters OTP
        ↓
Step 3: Response: userExists=false, hasUserDetails=false
        ↓
Navigate to: user-details.html
(User fills in: firstName, lastName, phoneNumber, dateOfBirth)
        ↓
Step 4: Submit details to /auth/update-details
        ↓
Navigate to: index.html (homepage)
```

### Case 2: Existing User without Profile Details
```
Step 1: User enters email
        ↓
Step 2: User enters OTP
        ↓
Step 3: Response: userExists=true, hasUserDetails=false
        ↓
Navigate to: user-details.html
(User fills in: firstName, lastName, phoneNumber, dateOfBirth)
        ↓
Step 4: Submit details to /auth/update-details
        ↓
Navigate to: index.html (homepage)
```

### Case 3: Existing User with Complete Profile
```
Step 1: User enters email
        ↓
Step 2: User enters OTP
        ↓
Step 3: Response: userExists=true, hasUserDetails=true
        ↓
Navigate to: index.html (homepage) with user dashboard
```

---

## Update User Details
**Endpoint:** `POST /auth/update-details`

**Request:**
```json
{
  "email": "john.doe.email@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "9876543210",
  "dateOfBirth": "15-01-1990"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "email": "john.doe.email@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "9876543210",
    "dateOfBirth": "15-01-1990"
  }
}
```

---

## Key Changes from Old API

### Old Flow (Separate endpoints):
- `/auth/register/send-otp` → Register only
- `/auth/login/send-otp` → Login only
- User had to choose register or login before entering email

### New Flow (Unified endpoint):
- `/auth/send-otp` → Works for both register and login
- `/auth/verify-otp` → Automatically handles new/existing users
- System detects user status and returns appropriate response
- Frontend navigates based on response flags

---

## Email Validation Rules

The email must satisfy all these conditions:
1. **Username length**: Minimum 8 characters before @
2. **Alphabetical characters**: At least one a-z character
3. **No uppercase**: Username cannot contain A-Z
4. **Domain format**: Must have @ and a valid domain (e.g., .com, .org)
5. **Valid format**: `[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}`

Example valid email: `john.doe.email@example.com`

---

## Response Codes

| Status | Message | Action |
|--------|---------|--------|
| Invalid Email | Email validation error | Show error message, retry |
| OTP Sent | `userExists: true/false` | Proceed to OTP entry screen |
| Invalid OTP | Invalid or expired OTP | Show error message, request new OTP |
| New User | Navigate to user-details.html | User fills profile |
| Existing User (no details) | Navigate to user-details.html | User updates profile |
| Existing User (complete) | Navigate to homepage | Show user dashboard |


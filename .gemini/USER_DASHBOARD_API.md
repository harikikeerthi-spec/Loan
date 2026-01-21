# User Dashboard API Documentation

## Overview
The User Dashboard API provides endpoints to retrieve user profile information and dashboard data for authenticated users.

## Base URL
```
http://localhost:3000
```

## Endpoints

### 1. Get User Dashboard
Retrieves complete user profile information for the dashboard.

**Endpoint:** `POST /auth/dashboard`

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <access_token>"
}
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "9876543210",
    "dateOfBirth": "15-01-1990",
    "createdAt": "2026-01-21T10:30:00.000Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "User not found"
}
```

## Frontend Integration

### Loading Dashboard Data

The dashboard automatically loads when a user is logged in:

```javascript
// Automatically called on page load
loadUserDashboard();
```

### User Data Storage

User data is stored in `localStorage`:
- `accessToken`: JWT authentication token
- `userEmail`: User's email address
- `firstName`: User's first name
- `lastName`: User's last name

### UI Updates

The dashboard script automatically:
1. ✅ Shows user email in the profile section
2. ✅ Hides login/signup buttons
3. ✅ Displays user profile dropdown
4. ✅ Enables logout functionality

## Usage Example

### JavaScript (Frontend)
```javascript
// Load user dashboard
const userData = await loadUserDashboard();

// Access user information
console.log(userData.firstName); // "John"
console.log(userData.email);     // "user@example.com"
console.log(userData.phoneNumber); // "9876543210"
console.log(userData.dateOfBirth); // "15-01-1990"
```

### cURL (Testing)
```bash
curl -X POST http://localhost:3000/auth/dashboard \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"email":"user@example.com"}'
```

### Postman
1. **Method:** POST
2. **URL:** `http://localhost:3000/auth/dashboard`
3. **Headers:**
   - Content-Type: `application/json`
   - Authorization: `Bearer YOUR_ACCESS_TOKEN`
4. **Body (raw JSON):**
```json
{
  "email": "user@example.com"
}
```

## Features

### ✅ User Profile Display
- Full name (firstName + lastName)
- Email address
- Phone number (10 digits)
- Date of birth (DD-MM-YYYY format)
- Account creation date

### ✅ Authentication
- JWT token validation
- Automatic redirect to login if not authenticated
- Secure user data retrieval

### ✅ User Experience
- Profile dropdown menu
- Logout functionality
- Automatic UI updates based on login status

## Files Created/Modified

### Backend:
1. `server/server/src/auth/auth.controller.ts` - Added dashboard endpoint
2. `server/server/src/auth/auth.service.ts` - Added getUserDashboard method

### Frontend:
1. `web/assets/js/dashboard.js` - Dashboard API integration (NEW)
2. `web/index.html` - Added dashboard script

## Security Considerations

1. **Authentication Required:** All dashboard endpoints require a valid JWT token
2. **User Validation:** Email is validated before returning data
3. **Error Handling:** Proper error messages for unauthorized access
4. **Token Storage:** Access token stored securely in localStorage

## Error Handling

### Common Errors:

| Error | Status Code | Description | Solution |
|-------|------------|-------------|----------|
| User not found | 401 | Email doesn't exist in database | Verify email or register |
| Invalid token | 401 | JWT token is invalid or expired | Re-login to get new token |
| Missing email | 400 | Email not provided in request | Include email in request body |

## Testing Checklist

- [ ] User can view their profile information
- [ ] Profile dropdown shows correct email
- [ ] Logout clears localStorage and redirects to login
- [ ] Unauthorized users are redirected to login page
- [ ] Date of birth displays in DD-MM-YYYY format
- [ ] Phone number displays correctly
- [ ] User name displays in profile section

## Next Steps

To enhance the dashboard, you can:
1. Add loan application history
2. Display loan status and progress
3. Show document upload status
4. Add profile edit functionality
5. Implement dashboard analytics
6. Add notification system

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify JWT token is valid
- Ensure user exists in database
- Check network requests in browser DevTools

# Authentication Flow Changes - Unified Login System

## Overview
The authentication system has been consolidated to use a single **Login Page** instead of separate signin and signup pages. The system now follows a unified email + OTP flow for both new and existing users.

## Changes Made

### 1. **Signup Page Removed/Redirected**
- **File**: [signup.html](web/signup.html)
- **Status**: ✅ Converted to redirect page
- **Behavior**: Any user navigating to `signup.html` will automatically be redirected to `login.html`
- **Implementation**: Simple HTML redirect with message "Redirecting to login page..."

### 2. **Login Page - Unified Flow**
- **File**: [login.html](web/login.html)
- **Status**: ✅ Complete unified authentication flow
- **Flow Steps**:
  1. User lands on login page
  2. User enters email address
  3. User clicks "Get OTP" button
  4. OTP is sent to their email
  5. User enters 6-digit OTP
  6. System verifies OTP and checks if user exists:
     - **If user exists**: Navigate to `index.html` (home page)
     - **If new user**: Navigate to `user-details.html` to collect user details, then to home page
  7. User is logged in with access token stored in localStorage

### 3. **Homepage Navbar - Login Button**
- **File**: [index.html](web/index.html) (lines 196-197)
- **Status**: ✅ Already present and functional
- **Implementation**: 
  ```html
  <a href="login.html" id="loginLink"
      class="px-6 py-2.5 text-sm font-bold bg-primary text-white rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 cursor-pointer">Login</a>
  ```
- **Behavior**:
  - Shows when user is NOT logged in
  - Hides when user IS logged in
  - Replaced with profile dropdown menu when authenticated
  - Managed by `auth.js`

### 4. **Authentication System - Navbar Management**
- **File**: [assets/js/auth.js](web/assets/js/auth.js)
- **Status**: ✅ Already configured and functional
- **Key Functions**:
  - `isUserLoggedIn()`: Checks if user has access token
  - `updateNavbarAuth()`: Toggles login/profile sections based on auth state
  - `logout()`: Clears user data and redirects to home
- **Features**:
  - Shows "Login" button when logged out
  - Shows user profile dropdown with options when logged in:
    - Dashboard
    - My Profile
    - My Applications
    - Document Vault
    - Settings
    - Help & Support
    - Logout

### 5. **Login JavaScript Logic**
- **File**: [assets/js/login.js](web/assets/js/login.js)
- **Status**: ✅ Complete implementation
- **Features**:
  - Email validation and OTP request
  - 6-digit OTP input with auto-focus between digits
  - OTP verification and submission
  - User existence check
  - Automatic redirect based on user status
  - localStorage management for session persistence

## User Experience

### For New Users:
1. Click "Login" button in navbar on homepage
2. Enter email address
3. Get OTP via email
4. Enter OTP
5. Provide personal details (name, DOB, phone, etc.)
6. Access dashboard/home page

### For Existing Users:
1. Click "Login" button in navbar on homepage
2. Enter email address
3. Get OTP via email
4. Enter OTP
5. Direct access to dashboard/home page

### When Logged In:
- Login button disappears from navbar
- User profile section appears with dropdown menu
- User email displayed in navbar
- Can access dashboard, profile, applications, vault, settings, help
- Can logout by clicking logout button in dropdown

## Technical Details

### Session Management
- Access token stored in `localStorage` as `accessToken`
- User email stored in `localStorage` as `userEmail`
- User details (firstName, lastName) stored in `localStorage`
- Logout clears all localStorage data

### API Endpoints Used
- `POST /auth/send-otp` - Sends OTP to email
- `POST /auth/verify-otp` - Verifies OTP and returns user status

### Redirect Logic
- New users without user details: `user-details.html`
- Existing users or after details saved: `index.html`
- After logout: `index.html`

## Files Modified/Created

| File | Status | Changes |
|------|--------|---------|
| [web/signup.html](web/signup.html) | Modified | Converted to redirect page |
| [web/login.html](web/login.html) | Verified | Unified login flow ✅ |
| [web/index.html](web/index.html) | Verified | Login button in navbar ✅ |
| [web/assets/js/login.js](web/assets/js/login.js) | Verified | Complete flow logic ✅ |
| [web/assets/js/auth.js](web/assets/js/auth.js) | Verified | Navbar management ✅ |

## Files NOT Needed (Removed/Deprecated)
- Separate "signin" page - No longer exists
- Separate "signup" page - Now redirects to login
- Signup-specific JavaScript - signup flow merged into login

## Notes
- All authentication now goes through a single login page
- System automatically handles both new and existing users
- User experience is seamless with unified UI
- No breaking changes to other pages
- Session persists across page refreshes via localStorage
- Profile dropdown is managed by auth.js and appears on all pages that include it

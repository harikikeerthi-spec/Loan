/**
 * Authentication Guard - Frontend route protection
 * Manages tokens, role checks, and redirect logic
 */
class AuthGuard {
  static TOKEN_KEY = 'accessToken';

  /**
   * Decode JWT token
   */
  static parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  /**
   * Get current authenticated user details from token
   */
  static getCurrentUser() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;

    const decoded = this.parseJwt(token);
    if (!decoded) return null;

    // Check expiration — but try refreshing first before clearing
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      // Don't clear auth here — let the refresh mechanism handle it
      // Return decoded payload so the caller can still attempt a refresh
      console.warn('AuthGuard: Access token expired, refresh may be needed');
      return decoded;
    }

    return decoded;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated() {
    return !!this.getCurrentUser();
  }

  /**
   * Check if user has a specific role
   */
  static hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  /**
   * Check if user is admin or super_admin
   */
  static isAdmin() {
    const user = this.getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'super_admin');
  }

  /**
   * Check if user is super admin
   */
  static isSuperAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'super_admin';
  }

  /**
   * Verify token - returns true if valid
   */
  static async verifyToken() {
    return this.isAuthenticated();
  }

  static adminPages = [
    'admin-dashboard.html',
    'admin-blogs.html',
    'create-blog-canva.html',
    'admin-vs-user.html',
    'test-admin-system.html',
    'admin-community.html'
  ];

  /**
   * Check if current page is admin page
   */
  static isCurrentPageAdmin() {
    const path = window.location.pathname;
    return this.adminPages.some(page => path.includes(page)) || path.startsWith('/admin/');
  }

  /**
   * Redirect to login page
   */
  static redirectToLogin() {
    const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);

    if (this.isCurrentPageAdmin()) {
      window.location.href = `admin-login.html?redirect=${redirectUrl}`;
    } else {
      window.location.href = `login.html?redirect=${redirectUrl}`;
    }
  }

  /**
   * Redirect to home page
   */
  static redirectToHome() {
    window.location.href = 'index.html';
  }

  /**
   * Clear authentication data
   */
  static clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('userId');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    sessionStorage.clear(); // Clear session too just in case
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { authenticated: false } }));
  }

  /**
   * Get authorization header for API calls
   */
  static getAuthHeader() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Protect a route - Checks login and role
   */
  static async protectRoute(requiredRole = 'admin') {
    const user = this.getCurrentUser();

    if (!user) {
      console.warn('AuthGuard: No user found, redirecting to login');
      this.redirectToLogin();
      return false;
    }

    // Check role requirement
    if (requiredRole === 'admin' && !this.isAdmin()) {
      console.warn('AuthGuard: User is not admin', user.role);
      alert('Access Denied: Admin privileges required. Please login with an admin account.');
      this.clearAuth();
      // Force redirect to admin login if accessing admin page
      if (this.isCurrentPageAdmin()) {
        window.location.href = 'admin-login.html';
      } else {
        this.redirectToLogin();
      }
      return false;
    }

    if (requiredRole === 'super_admin' && !this.isSuperAdmin()) {
      alert('Access Denied: Super Admin privileges required. Please login with an admin account.');
      this.clearAuth();
      // Ensure super-admin access denial always goes to the admin login page
      window.location.href = 'admin-login.html';
      return false;
    }

    return true;
  }

  /**
   * Logout user
   */
  static logout() {
    this.clearAuth();
    this.redirectToLogin(); // Will redirect to correct login page based on current page
  }
}

// Auto-protect admin routes on page load
document.addEventListener('DOMContentLoaded', async () => {
  if (AuthGuard.isCurrentPageAdmin()) {
    console.log('AuthGuard: Checking protection for admin page');
    const requiredRole = window.location.pathname.includes('super-admin') ? 'super_admin' : 'admin';

    // Slight delay to ensure scripts are loaded
    setTimeout(() => {
      AuthGuard.protectRoute(requiredRole);
    }, 100);
  }
});

// Export globally
window.AuthGuard = AuthGuard;

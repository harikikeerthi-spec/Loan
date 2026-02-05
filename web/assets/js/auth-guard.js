/**
 * Authentication Guard - Frontend route protection
 * Manages tokens, role checks, and redirect logic
 */
class AuthGuard {
  static TOKEN_KEY = 'auth_token';
  static USER_KEY = 'current_user';
  static API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

  /**
   * Check if user is authenticated
   */
  static isAuthenticated() {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser() {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
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
   * Verify token with backend
   */
  static async verifyToken() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      this.redirectToLogin();
      return false;
    }

    try {
      const response = await fetch(`${this.API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        this.clearAuth();
        this.redirectToLogin();
        return false;
      }

      const data = await response.json();
      if (data.success && data.data) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(data.data));
      }

      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      this.redirectToLogin();
      return false;
    }
  }

  /**
   * Redirect to login page
   */
  static redirectToLogin() {
    const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?redirect=${redirectUrl}`;
  }

  /**
   * Redirect to admin dashboard
   */
  static redirectToAdminDashboard() {
    window.location.href = '/admin/dashboard';
  }

  /**
   * Redirect to home page
   */
  static redirectToHome() {
    window.location.href = '/';
  }

  /**
   * Clear authentication data
   */
  static clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { authenticated: false } }));
  }

  /**
   * Store auth token and user data
   */
  static setAuth(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { authenticated: true, user } }));
  }

  /**
   * Get authorization header for API calls
   */
  static getAuthHeader() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Protect a route - call at top of admin pages
   */
  static async protectRoute(requiredRole = 'admin') {
    if (!await this.verifyToken()) {
      return false;
    }

    const user = this.getCurrentUser();
    if (!user) {
      this.redirectToLogin();
      return false;
    }

    // Check role requirement
    if (requiredRole === 'admin' && !this.isAdmin()) {
      alert('Admin access required');
      this.redirectToHome();
      return false;
    }

    if (requiredRole === 'super_admin' && !this.isSuperAdmin()) {
      alert('Super Admin access required');
      this.redirectToHome();
      return false;
    }

    return true;
  }

  /**
   * Check if user can edit a blog item
   */
  static canEditBlog(blogItem) {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super admin can edit any blog
    if (user.role === 'super_admin') return true;

    // Regular admin can edit own blogs
    return blogItem.authorId === user.id;
  }

  /**
   * Check if user can view a blog (in admin context)
   */
  static canViewBlog(blogItem) {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super admin can view all
    if (user.role === 'super_admin') return true;

    // Own blog: view all statuses
    if (blogItem.authorId === user.id) return true;

    // Other admin's blog: only view if published
    return blogItem.status === 'published' && blogItem.visibility === 'public';
  }

  /**
   * Logout user
   */
  static logout() {
    this.clearAuth();
    this.redirectToLogin();
  }
}

// Protect admin routes on page load
document.addEventListener('DOMContentLoaded', async () => {
  const isAdminRoute = window.location.pathname.startsWith('/admin') || 
                       window.location.pathname.startsWith('/super-admin');
  
  if (isAdminRoute) {
    const requiredRole = window.location.pathname.startsWith('/super-admin') ? 'super_admin' : 'admin';
    const isProtected = await AuthGuard.protectRoute(requiredRole);
    
    if (!isProtected) {
      // Route protection will handle redirect
    }
  }
});

// Export
window.AuthGuard = AuthGuard;

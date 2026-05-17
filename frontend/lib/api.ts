/**
 * Centralized API client for all backend requests
 */

// Relative path: works on localhost, Cloudflare tunnels, and production alike.
// Next.js rewrites /api/* → http://localhost:5000/* on the server side.
const API_URL = "/api";

type Portal = "student" | "staff" | "admin" | "bank";

function getPortalFromPathname(pathname?: string): Portal {
    if (!pathname) return "student";
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/staff")) return "staff";
    if (pathname.startsWith("/bank")) return "bank";
    return "student";
}

function getStorageKeys(portal: Portal) {
    if (portal === "admin") {
        return {
            token: "adminAccessToken",
            refreshToken: "adminRefreshToken",
            email: "adminUserEmail",
            userId: "adminUserId",
            user: "adminAuthUser",
            loginPath: "/admin/login",
        };
    }
    if (portal === "staff") {
        return {
            token: "staffAccessToken",
            refreshToken: "staffRefreshToken",
            email: "staffUserEmail",
            userId: "staffUserId",
            user: "staffAuthUser",
            loginPath: "/staff/login",
        };
    }
    if (portal === "bank") {
        return {
            token: "bankAccessToken",
            refreshToken: "bankRefreshToken",
            email: "bankUserEmail",
            userId: "bankUserId",
            user: "bankAuthUser",
            loginPath: "/login",
        };
    }
    return {
        token: "accessToken",
        refreshToken: "refreshToken",
        email: "userEmail",
        userId: "userId",
        user: "authUser",
        loginPath: "/login",
    };
}

function clearAllPortalAuthStorage() {
    const portals: Portal[] = ["student", "staff", "admin", "bank"];
    for (const portal of portals) {
        const keys = getStorageKeys(portal);
        localStorage.removeItem(keys.token);
        localStorage.removeItem(keys.refreshToken);
        localStorage.removeItem(keys.email);
        localStorage.removeItem(keys.userId);
        localStorage.removeItem(keys.user);
    }
}

// ─── Agent ────────────────────────────────────────────────────────────
export const agentApi = {
    getStats: () =>
        fetch(`${API_URL}/applications/agent/stats`, { headers: authHeaders() }).then(handleResponse),
    getApplications: () =>
        fetch(`${API_URL}/applications/agent/list`, { headers: authHeaders() }).then(handleResponse),
};

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    const portal = getPortalFromPathname(window.location.pathname);
    const keys = getStorageKeys(portal);
    
    // 1. Try portal-specific token
    const portalToken = localStorage.getItem(keys.token);
    if (portalToken) return portalToken;

    // 2. Try Admin token (highest privilege) - useful for super_admins accessing staff/bank portals
    const adminToken = localStorage.getItem("adminAccessToken");
    if (adminToken) return adminToken;

    // 3. Try Staff token - useful if staff navigates to other common areas
    const staffToken = localStorage.getItem("staffAccessToken");
    if (staffToken) return staffToken;

    // 4. Fallback to generic student token
    return localStorage.getItem("accessToken");
}

function authHeaders(): HeadersInit {
    const token = getToken();
    return token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}

/**
 * Enhanced fetch wrapper that handles automatic token refresh on 401 "Token has expired"
 */
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: {
            ...authHeaders(),
            ...options.headers,
        },
    });

    if (res.status === 401) {
        const clone = res.clone();
        try {
            const body = await clone.json();
            if (body.message === 'Token has expired') {
                const portal = getPortalFromPathname(typeof window !== "undefined" ? window.location.pathname : "");
                const keys = getStorageKeys(portal);
                const refreshToken = localStorage.getItem(keys.refreshToken);

                if (refreshToken) {
                    console.log("[API] Token expired, attempting silent refresh...");
                    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    });

                    if (refreshRes.ok) {
                        const data = await refreshRes.json();
                        const newToken = data.access_token || data.accessToken;
                        if (newToken) {
                            console.log("[API] Refresh successful, retrying original request.");
                            localStorage.setItem(keys.token, newToken);
                            // Retry with new token
                            return fetch(url, {
                                ...options,
                                headers: {
                                    ...options.headers,
                                    'Authorization': `Bearer ${newToken}`,
                                    'Content-Type': 'application/json'
                                },
                            }).then((r) => handleResponse<T>(r));
                        }
                    }
                    console.warn("[API] Silent refresh failed or returned no token.");
                }
            }
        } catch (e) {
            // Not JSON or other error, fall through to handleResponse
        }
    }

    return handleResponse(res);
}

async function handleResponse<T>(res: Response): Promise<T> {
    const contentType = res.headers.get("content-type");
    let body: any;
    
    if (contentType && contentType.includes("application/json")) {
        body = await res.json();
    } else {
        body = await res.text();
    }
    
    console.log(`[API Response] ${res.status} ${res.url}`, { 
        ok: res.ok, 
        contentType, 
        body,
        bodyKeys: typeof body === 'object' ? Object.keys(body) : 'not-an-object'
    });

    if (!res.ok) {
        console.error(`API Error: ${res.status} ${res.url}`, body);
        let err;
        try {
            err = typeof body === 'string' ? JSON.parse(body) : body;
        } catch (e) {
            err = { message: body || res.statusText };
        }

        // Handle Token Expiration globally
        if (res.status === 401 && err?.message === 'Token has expired') {
            if (typeof window !== "undefined") {
                clearAllPortalAuthStorage();
                const portal = getPortalFromPathname(window.location.pathname);
                const { loginPath } = getStorageKeys(portal);
                // Avoid infinite redirect loops if already on login
                if (!window.location.pathname.startsWith(loginPath)) {
                    window.location.href = `${loginPath}?expired=true`;
                }
            }
        }

        throw new Error(err.message || "API request failed");
    }

    return body as T;
}

/**
 * Fetch wrapper for binary responses (blobs) with proper error handling
 */
async function fetchBlob(url: string, options: RequestInit = {}): Promise<Blob> {
    const token = getToken();
    const headers = token
        ? { Authorization: `Bearer ${token}`, ...options.headers }
        : options.headers;

    const res = await fetch(url, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorMessage = `HTTP ${res.status}`;
        
        try {
            if (contentType?.includes("application/json")) {
                const errorBody = await res.json();
                errorMessage = errorBody.message || errorMessage;
            } else {
                const errorText = await res.text();
                if (errorText) errorMessage = errorText;
            }
        } catch (e) {
            // Unable to parse error response
        }

        throw new Error(`Failed to fetch document: ${errorMessage}`);
    }

    return res.blob();
}

// ─── Auth ─────────────────────────────────────────────────────────────
export const authApi = {
    sendOtp: (email: string) =>
        fetch(`${API_URL}/auth/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        }).then(handleResponse),

    verifyOtp: (email: string, otp: string, referralCode?: string) =>
        fetch(`${API_URL}/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp, referralCode }),
        }).then(handleResponse),

    firebaseLogin: (idToken: string) =>
        fetch(`${API_URL}/auth/firebase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
        }).then(handleResponse),

    refresh: (refreshToken: string) =>
        fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        }).then(handleResponse),

    logout: (email: string) =>
        fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        }).then(handleResponse),

    getDashboard: (email: string) =>
        fetch(`${API_URL}/auth/dashboard`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ email }),
        }).then(handleResponse),

    getDashboardData: (userId: string) =>
        fetch(`${API_URL}/auth/dashboard-data`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ userId }),
        }).then(handleResponse),

    updateDetails: (email: string, details: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        dateOfBirth: string;
        passportNumber?: string;
    }) =>
        fetch(`${API_URL}/auth/update-details`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ email, ...details }),
        }).then(handleResponse),

    uploadDocument: (data: {
        userId: string;
        docType: string;
        uploaded: boolean;
        filePath?: string;
    }) =>
        fetch(`${API_URL}/auth/upload-document`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),
};

// ─── Blogs ────────────────────────────────────────────────────────────
export const blogApi = {
    getAll: (page = 1, limit = 10) => {
        const offset = (page - 1) * limit;
        return fetch(`${API_URL}/blogs?offset=${offset}&limit=${limit}`).then(handleResponse);
    },

    getBySlug: (slug: string) =>
        fetch(`${API_URL}/blogs/${slug}`).then(handleResponse),

    create: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/blogs`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    update: (id: string, data: Record<string, unknown>) =>
        fetch(`${API_URL}/blogs/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    delete: (id: string) =>
        fetch(`${API_URL}/blogs/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        }).then(handleResponse),
};

// ─── Community / Forum ───────────────────────────────────────────────
export const communityApi = {
    // Basic posts (legacy/alias)
    getPosts: (topic?: string, page = 1) =>
        fetch(`${API_URL}/community/posts?${topic ? `topic=${topic}&` : ""}page=${page}`).then(handleResponse),

    getPostBySlug: (slug: string) =>
        fetch(`${API_URL}/community/posts/${slug}`).then(handleResponse),

    createPost: (data: { title: string; content: string; category: string; force?: boolean }) =>
        fetch(`${API_URL}/community/posts`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    // Engagement
    addComment: (postId: string, content: string) =>
        fetch(`${API_URL}/community/posts/${postId}/comments`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ content }),
        }).then(handleResponse),

    likePost: (postId: string) =>
        fetch(`${API_URL}/community/posts/${postId}/like`, {
            method: "POST",
            headers: authHeaders(),
        }).then(handleResponse),

    // New Forum structure
    getForumPosts: (params?: { category?: string; tag?: string; sort?: string; limit?: number; offset?: number }) => {
        const q = new URLSearchParams();
        if (params?.category) q.set('category', params.category);
        if (params?.tag) q.set('tag', params.tag);
        if (params?.sort) q.set('sort', params.sort);
        if (params?.limit) q.set('limit', String(params.limit));
        if (params?.offset) q.set('offset', String(params.offset));
        return fetch(`${API_URL}/community/forum?${q.toString()}`).then(handleResponse);
    },

    getForumPost: (id: string) =>
        fetch(`${API_URL}/community/forum/${id}`, {
            headers: authHeaders(),
        }).then(handleResponse),

    likeForumPost: (postId: string) =>
        fetch(`${API_URL}/community/forum/${postId}/like`, {
            method: "POST",
            headers: authHeaders(),
        }).then(handleResponse),

    addForumComment: (postId: string, content: string, parentId?: string) =>
        fetch(`${API_URL}/community/forum/${postId}/comment`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ content, parentId }),
        }).then(handleResponse),

    likeForumComment: (commentId: string) =>
        fetch(`${API_URL}/community/forum/comments/${commentId}/like`, {
            method: "POST",
            headers: authHeaders(),
        }).then(handleResponse),

    // Hubs, Stats, etc.
    getHubs: () => fetch(`${API_URL}/community/hubs`).then(handleResponse),

    getStats: () => fetch(`${API_URL}/community/stats`).then(handleResponse),

    checkDuplicate: (data: { title: string; content: string; category: string }) =>
        fetch(`${API_URL}/community/forum/check-duplicate`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    checkRelevance: (title: string, content: string) =>
        fetch(`${API_URL}/ai/check-relevance`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ title, content }),
        }).then(handleResponse),

    searchSimilarPosts: (q: string) =>
        fetch(`${API_URL}/community/forum/search?q=${encodeURIComponent(q)}`).then(handleResponse),

    // Specialized data
    getMentors: (params?: { limit?: number; offset?: number }) => {
        const q = new URLSearchParams();
        if (params?.limit) q.set('limit', String(params.limit));
        if (params?.offset) q.set('offset', String(params.offset));
        return fetch(`${API_URL}/community/mentors?${q.toString()}`).then(handleResponse);
    },

    getEvents: (params?: { limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.limit) q.set('limit', String(params.limit));
        return fetch(`${API_URL}/community/events?${q.toString()}`).then(handleResponse);
    },

    getStories: (params?: { limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.limit) q.set('limit', String(params.limit));
        return fetch(`${API_URL}/community/stories?${q.toString()}`).then(handleResponse);
    },
};

// ─── Explore ─────────────────────────────────────────────────────────
export const exploreApi = {
    getAll: (params?: Record<string, string>) => {
        const query = params ? "?" + new URLSearchParams(params).toString() : "";
        return fetch(`${API_URL}/explore${query}`).then(handleResponse);
    },

    getUniversities: () =>
        fetch(`${API_URL}/explore/universities`).then(handleResponse),

    getCourses: () => fetch(`${API_URL}/explore/courses`).then(handleResponse),

    getScholarships: () =>
        fetch(`${API_URL}/explore/scholarships`).then(handleResponse),
};

// ─── Applications ─────────────────────────────────────────────────────
export const applicationApi = {
    create: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/auth/create-application`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    delete: (id: string) =>
        fetch(`${API_URL}/auth/application/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        }).then(handleResponse),
};

// ─── AI Tools ─────────────────────────────────────────────────────────
export const aiApi = {
    sopReview: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/ai/sop-analysis`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    sopHumanize: (text: string) =>
        fetch(`${API_URL}/ai/humanize-sop`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ text }),
        }).then(handleResponse),

    admitPredictor: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/ai/predict-admission`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    gradeConverter: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/ai/convert-grades`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }).then(handleResponse),

    gradeAnalyzer: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/ai/analyze-grades`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }).then(handleResponse),

    loanEligibility: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/ai/eligibility-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }).then(handleResponse),

    compareUniversities: (uni1: string, uni2: string) =>
        fetch(`${API_URL}/ai/compare-universities`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ uni1, uni2 }),
        }).then(handleResponse),

    compareShortlist: (shortlist: Array<{ name: string; course: string }>, profile: { bachelors?: string; workExp?: string; gpa?: string }) =>
        fetch(`${API_URL}/ai/compare-shortlist`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ shortlist, profile }),
        }).then(handleResponse),

    searchAdvice: (query: string, type: 'university' | 'course', context?: any) =>
        fetch(`${API_URL}/ai/search-advice`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ query, type, context }),
        }).then(handleResponse),

    suggestTags: (title: string) =>
        fetch(`${API_URL}/ai/suggest-tags`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ title }),
        }).then(handleResponse),

    // Always use relative path; the Next.js rewrite proxy routes to the backend.
    aiSearch: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/ai/search`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    saveVisaReport: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/ai/visa-interview/save-report`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),
};

// ─── Reference Data ───────────────────────────────────────────────────
export const referenceApi = {
    getBanks: () => fetch(`${API_URL}/reference/banks`).then(handleResponse),
    getCountries: () =>
        fetch(`${API_URL}/reference/countries`).then(handleResponse),
    getUniversities: () =>
        fetch(`${API_URL}/reference/universities`).then(handleResponse),
};

// ─── Onboarding ───────────────────────────────────────────────────────
export const onboardingApi = {
    submit: (data: Record<string, unknown>) =>
        apiFetch(`${API_URL}/onboarding`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    getStatus: (userId: string) =>
        apiFetch(`${API_URL}/onboarding/status/${userId}`),
};

// ─── Referral ─────────────────────────────────────────────────────────
export const referralApi = {
    // Get user's referral code (or create one if doesn't exist)
    getMyCode: () =>
        fetch(`${API_URL}/referral/my-code`, {
            headers: authHeaders(),
        }).then(handleResponse),

    // Get referral statistics
    getStats: () =>
        fetch(`${API_URL}/referral/stats`, {
            headers: authHeaders(),
        }).then(handleResponse),

    // Get list of referrals
    getList: (status?: string) => {
        const query = status ? `?status=${status}` : '';
        return fetch(`${API_URL}/referral/list${query}`, {
            headers: authHeaders(),
        }).then(handleResponse);
    },

    // Validate a referral code
    validateCode: (code: string) =>
        fetch(`${API_URL}/referral/validate/${code}`).then(handleResponse),

    // Record a new referral (when someone signs up with code)
    recordReferral: (data: { referralCode: string; referredUserId: string }) =>
        fetch(`${API_URL}/referral/record`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    // Send referral invite email
    sendInvite: (email: string) =>
        fetch(`${API_URL}/referral/invite`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ email }),
        }).then(handleResponse),

    // Get referral leaderboard
    getLeaderboard: (limit = 10) =>
        fetch(`${API_URL}/referral/leaderboard?limit=${limit}`, {
            headers: authHeaders(),
        }).then(handleResponse),

    // Record a visit to a referral link
    recordVisit: (code: string) =>
        fetch(`${API_URL}/referral/visit/${code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }).then(handleResponse),
};

// ─── Admin ────────────────────────────────────────────────────────────
export const adminApi = {
    // Stats
    getBlogStats: () =>
        apiFetch(`${API_URL}/blogs/admin/stats`),
    getApplicationStats: () =>
        apiFetch(`${API_URL}/applications/admin/stats`),

    // Blogs
    getBlogs: (params?: Record<string, string>) => {
        const query = params ? "?" + new URLSearchParams(params).toString() : "";
        return apiFetch(`${API_URL}/blogs/admin/all${query}`);
    },
    bulkUpdateBlogStatus: (blogIds: string[], isPublished: boolean) =>
        fetch(`${API_URL}/blogs/admin/bulk-status`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ blogIds, isPublished }),
        }).then(handleResponse),
    deleteBlog: (id: string) =>
        fetch(`${API_URL}/blogs/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        }).then(handleResponse),
    createBlog: (data: any) =>
        apiFetch(`${API_URL}/blogs`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    getUserStats: () =>
        apiFetch(`${API_URL}/users/admin/stats`),

    // Users
    getUsers: (limit = 30, offset = 0, search = "", role = "") => {
        let url = `${API_URL}/users/admin/list?limit=${limit}&offset=${offset}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (role) url += `&role=${encodeURIComponent(role)}`;
        return apiFetch(url);
    },
    updateUserRole: (email: string, role: string) =>
        apiFetch(`${API_URL}/users/make-admin`, {
            method: "POST",
            body: JSON.stringify({ email, role }),
        }),
    deleteUser: (id: string) =>
        apiFetch(`${API_URL}/users/admin/${id}`, {
            method: "DELETE",
        }),

    // Applications
    getApplications: (params?: Record<string, string>) => {
        const query = params ? "?" + new URLSearchParams(params).toString() : "";
        return apiFetch(`${API_URL}/applications/admin/all${query}`);
    },
    getApplication: (id: string) =>
        apiFetch(`${API_URL}/applications/${id}`),
    getApplicationTracking: (id: string) =>
        apiFetch(`${API_URL}/applications/admin/${id}/tracking`),
    getApplicationDocuments: (id: string) =>
        apiFetch(`${API_URL}/applications/admin/${id}/documents`),
    updateApplicationStatus: (id: string, data: Record<string, unknown>) =>
        apiFetch(`${API_URL}/applications/admin/${id}/status`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    updateApplication: (id: string, data: Record<string, unknown>) =>
        apiFetch(`${API_URL}/applications/admin/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    aiReviewApplication: (id: string) =>
        apiFetch(`${API_URL}/applications/admin/${id}/ai-review`, {
            method: "POST",
        }),
    deleteApplication: (id: string) =>
        apiFetch(`${API_URL}/applications/admin/${id}`, {
            method: "DELETE",
        }),
    shareApplication: (id: string) =>
        apiFetch(`${API_URL}/applications/admin/${id}/share`, {
            method: "POST",
        }),
    syncVaultDocuments: (id: string) =>
        apiFetch(`${API_URL}/applications/admin/${id}/sync-vault`, {
            method: "POST",
        }),

    // Community
    getCommunityStats: () =>
        apiFetch(`${API_URL}/community/admin/stats`),
    getForumPosts: (limit = 20, offset = 0) =>
        apiFetch(`${API_URL}/community/admin/forum/posts?limit=${limit}&offset=${offset}`),
    getMentors: () =>
        apiFetch(`${API_URL}/community/mentors`),
    createMentor: (data: any) =>
        apiFetch(`${API_URL}/community/admin/mentors`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    deleteMentor: (id: string) =>
        apiFetch(`${API_URL}/community/admin/mentors/${id}`, {
            method: "DELETE",
        }),
    getCommunityResources: (params?: Record<string, string>) => {
        const query = params ? "?" + new URLSearchParams(params).toString() : "";
        return apiFetch(`${API_URL}/community/resources${query}`);
    },
    createCommunityResource: (data: any) =>
        apiFetch(`${API_URL}/community/admin/resources`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    deleteCommunityResource: (id: string) =>
        apiFetch(`${API_URL}/community/admin/resources/${id}`, {
            method: "DELETE",
        }),
    togglePinForumPost: (id: string, isPinned: boolean) =>
        apiFetch(`${API_URL}/community/admin/forum/posts/${id}/pin`, {
            method: "PUT",
            body: JSON.stringify({ isPinned }),
        }),
    deleteForumPost: (id: string) =>
        apiFetch(`${API_URL}/community/forum/${id}`, {
            method: "DELETE",
        }),
    getAuditLogs: (limit = 20) =>
        apiFetch(`${API_URL}/blogs/admin/matrix-logs?limit=${limit}`),
    sendEmail: (data: { to?: string; subject: string; content: string; role?: string; isBulk?: boolean }) =>
        apiFetch(`${API_URL}/users/admin/send-email`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    createUser: (data: any) =>
        apiFetch(`${API_URL}/users/admin/create`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    updateUserDetails: (data: { email: string; firstName: string; lastName: string; phoneNumber: string; dateOfBirth: string }) =>
        apiFetch(`${API_URL}/users/admin/update-details`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getUserProfile: (email: string) =>
        apiFetch(`${API_URL}/users/profile`, {
            method: "POST",
            body: JSON.stringify({ email }),
            headers: authHeaders(),
        }),

    addRemark: (id: string, data: { type: string; content: string }) =>
        apiFetch(`${API_URL}/applications/admin/${id}/notes`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: authHeaders(),
        }),

    getRemarks: (id: string) =>
        apiFetch(`${API_URL}/applications/admin/${id}/notes`, {
            headers: authHeaders(),
        }),

    verifyDocument: (applicationId: string, documentId: string, status: string, rejectionReason?: string) =>
        apiFetch(`${API_URL}/applications/admin/documents/${documentId}/verify`, {
            method: 'PUT',
            body: JSON.stringify({ status, rejectionReason }),
            headers: authHeaders(),
        }),

    viewDocument: (applicationId: string, documentId: string): Promise<Blob> =>
        fetchBlob(`${API_URL}/applications/admin/${applicationId}/documents/${documentId}/view`),
};

// ─── Documents ────────────────────────────────────────────────────────
export const documentApi = {
    getUsersDocuments: (userId: string) =>
        apiFetch(`${API_URL}/documents/${userId}`),

    getUserDocuments: (userId: string) =>
        apiFetch(`${API_URL}/documents/${userId}`),

    delete: (userId: string, docType: string) =>
        apiFetch(`${API_URL}/documents/${userId}/${docType}`, {
            method: "DELETE",
        }),

    initiateDigilocker: (userId: string, docType: string) => {
        // Redirect directly — backend handles the OAuth flow
        window.location.href = `/api/digilocker/authorize?userId=${encodeURIComponent(userId)}&docType=${encodeURIComponent(docType)}`;
    },

    initiateDigiLockerPull: (userId: string, docType: string) =>
        apiFetch(`${API_URL}/documents/digilocker/initiate`, {
            method: 'POST',
            body: JSON.stringify({ userId, docType }),
        }),

    syncFromDigilocker: (userId: string, docType: string) =>
        fetch(`${API_URL}/digilocker/sync`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ userId, docType }),
        }).then(handleResponse),

    upload: (userId: string, docType: string, file: File, onProgress?: (progress: number) => void) => {
        return new Promise((resolve, reject) => {
            const token = (() => {
                if (typeof window === 'undefined') return null;
                return localStorage.getItem('staffAccessToken') || localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken');
            })();
            
            const xhr = new XMLHttpRequest();
            const form = new FormData();
            form.append('file', file);
            form.append('userId', userId);
            form.append('docType', docType);

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    onProgress((e.loaded / e.total) * 100);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        resolve(xhr.responseText);
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Network error')));
            
            xhr.open('POST', `${API_URL}/documents/upload`);
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(form);
        });
    },

    ocrReverify: (userId: string, docType: string) => {
        return apiFetch(`${API_URL}/documents/ocr-reverify`, {
            method: 'POST',
            body: JSON.stringify({ userId, docType }),
        });
    },

    addRequirement: (userId: string, docType: string, docName?: string) =>
        apiFetch(`${API_URL}/documents/requirement`, {
            method: 'POST',
            body: JSON.stringify({ userId, docType, docName }),
        }),

    /** Get a short-lived S3 presigned URL to view/preview a document. */
    getPresignedView: (userId: string, docType: string) =>
        apiFetch(`${API_URL}/documents/presigned-view/${encodeURIComponent(userId)}/${encodeURIComponent(docType)}`),

    /** Update student profile fields (e.g. from OCR extraction results). */
    updateProfile: (userId: string, updates: any) =>
        apiFetch(`${API_URL}/onboarding`, {
            method: "POST",
            body: JSON.stringify({ userId, ...updates }),
        }),
};


// ─── Connected / Cohort ───────────────────────────────────────────────
export const connectedApi = {
    apply: (data: {
        fullName: string;
        email: string;
        phone: string;
        targetIntake: string;
        destination?: string;
        university?: string;
        course?: string;
        gapYear?: boolean;
        message?: string;
    }) =>
        fetch(`${API_URL}/connected/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, source: "connectED" }),
        }).then(handleResponse),
};

// ─── University ───────────────────────────────────────────────────────
export const universityApi = {
    submitInquiry: (data: {
        userId?: string;
        name: string;
        email: string;
        mobile: string;
        universityName: string;
        type: 'callback' | 'fasttrack';
    }) =>
        fetch(`${API_URL}/university-inquiry`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    checkInquiry: (email: string, universityName: string, type: string): Promise<{ exists: boolean }> =>
        fetch(`${API_URL}/university-inquiry/check?email=${encodeURIComponent(email)}&universityName=${encodeURIComponent(universityName)}&type=${type}`, {
            headers: authHeaders(),
        }).then(res => handleResponse<{ exists: boolean }>(res)),
};

// ─── Chat ─────────────────────────────────────────────────────────────
export const chatApi = {
    connect: () =>
        fetch(`${API_URL}/chat/connect`, {
            method: "POST",
            headers: authHeaders(),
        }).then(handleResponse),

    getConversations: () =>
        fetch(`${API_URL}/chat/conversations`, {
            headers: authHeaders(),
        }).then(handleResponse),

    getMessages: (conversationId: string) =>
        fetch(`${API_URL}/chat/messages/${conversationId}`, {
            headers: authHeaders(),
        }).then(handleResponse),
};// ─── Staff Profile (Intermediary Flow) ───────────────────────────────
export const staffProfileApi = {
    // List all profiles (with optional search / bankStatus filter)
    list: (params?: { search?: string; bankStatus?: string }) => {
        const q = new URLSearchParams();
        if (params?.search) q.set('search', params.search);
        if (params?.bankStatus) q.set('bankStatus', params.bankStatus);
        return apiFetch(`${API_URL}/staff-profiles?${q.toString()}`);
    },

    // Check if a profile already exists for a linked user
    checkExists: (userId: string) =>
        apiFetch(`${API_URL}/staff-profiles/check/${userId}`),

    // Create a staff profile linked to a website user
    create: (data: { linked_user_id: string; target_bank?: string; loan_type?: string; internal_notes?: string }) =>
        apiFetch(`${API_URL}/staff-profiles`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Get a single profile with its documents
    get: (profileId: string) =>
        apiFetch(`${API_URL}/staff-profiles/${profileId}`),

    // Pull and attach all documents uploaded by the linked user
    fetchUserDocuments: (profileId: string) =>
        apiFetch(`${API_URL}/staff-profiles/${profileId}/fetch-documents`, {
            method: 'POST',
        }),

    // Get documents currently attached to a profile
    getDocuments: (profileId: string) =>
        apiFetch(`${API_URL}/staff-profiles/${profileId}/documents`),

    // Staff manually uploads a document and attaches it
    uploadDocument: (profileId: string, file: File, docType: string, onProgress?: (progress: number) => void, description?: string) => {
        return new Promise((resolve, reject) => {
            const token = (() => {
                if (typeof window === 'undefined') return null;
                return localStorage.getItem('staffAccessToken') || localStorage.getItem('adminAccessToken');
            })();
            
            const xhr = new XMLHttpRequest();
            const form = new FormData();
            form.append('file', file);
            form.append('doc_type', docType);
            if (description) form.append('description', description);

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    onProgress((e.loaded / e.total) * 100);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        resolve(xhr.responseText);
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Network error')));
            
            xhr.open('POST', `${API_URL}/staff-profiles/${profileId}/documents`);
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(form);
        });
    },

    // Update a document's status (also back-syncs to user's profile)
    updateDocumentStatus: (profileId: string, docId: string, status: string, rejectionReason?: string) =>
        apiFetch(`${API_URL}/staff-profiles/${profileId}/documents/${docId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, rejection_reason: rejectionReason }),
        }),

    // Remove (detach) a document from the profile
    removeDocument: (profileId: string, docId: string) =>
        apiFetch(`${API_URL}/staff-profiles/${profileId}/documents/${docId}`, {
            method: 'DELETE',
        }),

    // Share a document bundle with a bank
    shareWithBank: (profileId: string, data: {
        doc_ids: string[];
        bank_name: string;
        bank_email: string;
        expires_in_days?: number;
        access_note?: string;
    }) =>
        apiFetch(`${API_URL}/staff-profiles/${profileId}/share`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Get share history for a profile
    getShares: (profileId: string) =>
        apiFetch(`${API_URL}/staff-profiles/${profileId}/shares`),

    // S3 Document Management
    // Get presigned URL for S3 upload
    getS3PresignedUrl: (userId: string, docType: string, fileName: string, fileType: string) =>
        apiFetch(`${API_URL}/documents/presigned-url`, {
            method: 'POST',
            body: JSON.stringify({ userId, docType, fileName, fileType }),
        }),

    // Complete S3 document upload (register in database)
    completeS3Upload: (userId: string, docId: string, docType: string, s3Key: string, s3Url: string, personType: string, employmentType?: string) =>
        apiFetch(`${API_URL}/documents/complete-upload`, {
            method: 'POST',
            body: JSON.stringify({ userId, docId, docType, s3Key, s3Url, personType, employmentType }),
        }),

    // Fetch user documents from S3
    fetchUserS3Documents: (userId: string) =>
        apiFetch(`${API_URL}/documents/user/${userId}`),

    // Delete S3 document
    deleteS3Document: (docId: string) =>
        apiFetch(`${API_URL}/documents/${docId}`, {
            method: 'DELETE',
        }),

    // Download document from S3
    downloadS3Document: (s3Key: string) =>
        apiFetch(`${API_URL}/documents/download`, {
            method: 'POST',
            body: JSON.stringify({ s3Key }),
        }),

    // Verify S3 document
    verifyS3Document: (docId: string, status: string, rejectionReason?: string) =>
        apiFetch(`${API_URL}/documents/${docId}/verify`, {
            method: 'PATCH',
            body: JSON.stringify({ status, rejection_reason: rejectionReason }),
        }),

    // Dashboard Activities
    logActivity: (data: { type: string; msg: string; icon: string; color: string }) =>
        apiFetch(`${API_URL}/staff-profiles/activities`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getDashboardActivities: (limit = 15) =>
        apiFetch(`${API_URL}/staff-profiles/dashboard/activities?limit=${limit}`),

    getAllDashboardActivities: (opts: { limit?: number; offset?: number; type?: string; search?: string }) => {
        const params = new URLSearchParams();
        if (opts.limit !== undefined) params.append('limit', opts.limit.toString());
        if (opts.offset !== undefined) params.append('offset', opts.offset.toString());
        if (opts.type) params.append('type', opts.type);
        if (opts.search) params.append('search', opts.search);
        return apiFetch(`${API_URL}/staff-profiles/activities/all?${params.toString()}`);
    },

    // Share a student profile with a bank or the student (Step 4 of onboarding)
    shareProfile: (studentId: string, data: {
        recipientType: string;
        recipientName: string;
        recipientEmail: string;
        message?: string;
        sharedBy?: string;
    }) =>
        apiFetch(`${API_URL}/staff-profiles/share-profile/${studentId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};


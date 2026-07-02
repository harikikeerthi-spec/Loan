/**
 * Centralized API client for all backend requests
 */

// Relative path: works on localhost, Cloudflare tunnels, and production alike.
// Next.js rewrites /api/* → http://localhost:5000/* on the server side.
import { HTTP_API_PREFIX, HttpApiPaths } from "./http-api-paths";

const API_URL = HTTP_API_PREFIX;

export type TokenChangeCallback = (token: string | null) => void;
const tokenChangeListeners = new Set<TokenChangeCallback>();

export function subscribeToTokenChange(callback: TokenChangeCallback) {
    tokenChangeListeners.add(callback);
    return () => {
        tokenChangeListeners.delete(callback);
    };
}

export function notifyTokenChange(token: string | null) {
    tokenChangeListeners.forEach(cb => cb(token));
}

type Portal = "student" | "staff" | "admin" | "bank" | "agent";

function getPortalFromPathname(pathname?: string): Portal {
    if (!pathname) return "student";
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/staff")) return "staff";
    if (pathname.startsWith("/bank")) return "bank";
    if (pathname.startsWith("/agent")) return "agent";
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
            loginPath: "/bank/login",
        };
    }
    if (portal === "agent") {
        return {
            token: "agentAccessToken",
            refreshToken: "agentRefreshToken",
            email: "agentUserEmail",
            userId: "agentUserId",
            user: "agentAuthUser",
            loginPath: "/agent/login",
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
    const portals: Portal[] = ["student", "staff", "admin", "bank", "agent"];
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
        apiFetch(`${API_URL}/dashboard/summary`),
    getApplications: (params?: { search?: string; status?: string; loanType?: string; page?: number; limit?: number }) => {
        const query = new URLSearchParams();
        if (params?.search) query.append("search", params.search);
        if (params?.status) query.append("status", params.status);
        if (params?.loanType) query.append("loanType", params.loanType);
        if (params?.page) query.append("page", String(params.page));
        if (params?.limit) query.append("limit", String(params.limit));
        const queryString = query.toString();
        return apiFetch(`${API_URL}/leads${queryString ? `?${queryString}` : ""}`);
    },
    createLead: (data: any) =>
        apiFetch(`${API_URL}/leads`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getActivityFeed: () =>
        apiFetch(`${API_URL}/dashboard/activity-feed`),
    getActionItems: () =>
        apiFetch(`${API_URL}/dashboard/action-items`),
    getPipeline: () =>
        apiFetch(`${API_URL}/dashboard/pipeline`),
    checkEligibility: (data: any) =>
        apiFetch(`${API_URL}/eligibility/check`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getLeadDetail: (id: string) =>
        apiFetch(`${API_URL}/leads/${id}`),
    getLeadChecklist: (id: string) =>
        apiFetch(`${API_URL}/leads/${id}/checklist`),
    shareUploadLink: (id: string, data: any) =>
        apiFetch(`${API_URL}/leads/${id}/share-upload-link`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getCommissionsSummary: () =>
        apiFetch(`${API_URL}/commissions/summary`),
    getCommissionsLedger: () =>
        apiFetch(`${API_URL}/commissions/ledger`),
    getCommissionsPayouts: () =>
        apiFetch(`${API_URL}/commissions/payouts`),
    getCommissionsRateCard: () =>
        apiFetch(`${API_URL}/commissions/rate-card`),
    getMe: () =>
        apiFetch(`${API_URL}/agents/me`),
    getKyc: () =>
        apiFetch(`${API_URL}/kyc`),
    submitKyc: (data: any) =>
        apiFetch(`${API_URL}/kyc`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getKycDocuments: () =>
        apiFetch(`${API_URL}/kyc/documents`),
    getBankAccount: () =>
        apiFetch(`${API_URL}/bank-account`),
    updateBankAccount: (data: any) =>
        apiFetch(`${API_URL}/bank-account`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getAgreements: () =>
        apiFetch(`${API_URL}/agreements`),
    getSupportTickets: () =>
        apiFetch(`${API_URL}/support/tickets`),
    createSupportTicket: (data: any) =>
        apiFetch(`${API_URL}/support/tickets`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getChatMessages: (staffId: string) =>
        apiFetch(`${API_URL}/chat/${staffId}`),
    sendChatMessage: (staffId: string, data: { content: string }) =>
        apiFetch(`${API_URL}/chat/${staffId}`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

export function getToken(): string | null {
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
    const headers: Record<string, string> = token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };

    if (typeof window !== "undefined") {
        const selectedBankId = sessionStorage.getItem("selectedBank") || localStorage.getItem("selectedBank");
        if (selectedBankId) {
            const bankNameMap: Record<string, string> = {
                auxilo: "Auxilo Finserve",
                avanse: "Avanse Financial",
                credila: "HDFC Credila",
                idfc: "IDFC FIRST Bank",
                poonawalla: "Poonawalla Fincorp",
            };
            const mappedBankName = bankNameMap[selectedBankId];
            if (mappedBankName) {
                headers["x-selected-bank"] = mappedBankName;
            }
        }
    }
    return headers;
}

/**
 * Enhanced fetch wrapper that handles automatic token refresh on 401 "Token has expired"
 */
export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
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
                const refreshToken = localStorage.getItem(keys.refreshToken) || localStorage.getItem("refreshToken");

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
                            notifyTokenChange(newToken);
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

        // Handle Token Expiration and Unauthorized globally
        if (res.status === 401) {
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
        apiFetch(HttpApiPaths.auth.sendOtp(), {
            method: "POST",
            body: JSON.stringify({ email }),
        }),

    requestOtp: (email: string) =>
        apiFetch(`${API_URL}/auth/request-otp`, {
            method: "POST",
            body: JSON.stringify({ email }),
        }),

    verifyOtp: (email: string, otp: string, referralCode?: string) =>
        apiFetch(HttpApiPaths.auth.verifyOtp(), {
            method: "POST",
            body: JSON.stringify({ email, otp, referralCode }),
        }),

    firebaseLogin: (idToken: string) =>
        apiFetch(HttpApiPaths.auth.firebase(), {
            method: "POST",
            body: JSON.stringify({ idToken }),
        }),

    refresh: (refreshToken: string) =>
        apiFetch(HttpApiPaths.auth.refresh(), {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
        }),

    logout: (email: string) =>
        apiFetch(HttpApiPaths.auth.logout(), {
            method: "POST",
            body: JSON.stringify({ email }),
        }),

    getDashboard: (email: string) =>
        apiFetch(HttpApiPaths.auth.dashboard(), {
            method: "POST",
            body: JSON.stringify({ email }),
        }),

    getDashboardData: (userId: string) =>
        apiFetch(HttpApiPaths.auth.dashboardData(), {
            method: "POST",
            body: JSON.stringify({ userId }),
        }),

    updateDetails: (email: string, details: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        dateOfBirth: string;
        passportNumber?: string;
        intakeSeason?: string;
    }) =>
        apiFetch(HttpApiPaths.auth.updateDetails(), {
            method: "POST",
            body: JSON.stringify({ email, ...details }),
        }),

    uploadDocument: (data: {
        userId: string;
        docType: string;
        uploaded: boolean;
        filePath?: string;
    }) =>
        apiFetch(HttpApiPaths.auth.uploadDocument(), {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// ─── Blogs ────────────────────────────────────────────────────────────
export const blogApi = {
    getAll: (page = 1, limit = 10) => {
        const offset = (page - 1) * limit;
        return apiFetch(`${API_URL}/blogs?offset=${offset}&limit=${limit}`);
    },

    getBySlug: (slug: string) =>
        apiFetch(`${API_URL}/blogs/${slug}`),

    create: (data: Record<string, unknown>) =>
        apiFetch(`${API_URL}/blogs`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: Record<string, unknown>) =>
        apiFetch(`${API_URL}/blogs/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiFetch(`${API_URL}/blogs/${id}`, {
            method: "DELETE",
        }),
};

// ─── Community / Forum ───────────────────────────────────────────────
export const communityApi = {
    // Basic posts (legacy/alias)
    getPosts: (topic?: string, page = 1) =>
        apiFetch(`${API_URL}/community/posts?${topic ? `topic=${topic}&` : ""}page=${page}`),

    getPostBySlug: (slug: string) =>
        apiFetch(`${API_URL}/community/posts/${slug}`),

    createPost: (data: { title: string; content: string; category: string; force?: boolean }) =>
        apiFetch(`${API_URL}/community/posts`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Engagement
    addComment: (postId: string, content: string) =>
        apiFetch(`${API_URL}/community/posts/${postId}/comments`, {
            method: "POST",
            body: JSON.stringify({ content }),
        }),

    likePost: (postId: string) =>
        apiFetch(`${API_URL}/community/posts/${postId}/like`, {
            method: "POST",
        }),

    // New Forum structure
    getForumPosts: (params?: { category?: string; tag?: string; sort?: string; limit?: number; offset?: number }) => {
        const q = new URLSearchParams();
        if (params?.category) q.set('category', params.category);
        if (params?.tag) q.set('tag', params.tag);
        if (params?.sort) q.set('sort', params.sort);
        if (params?.limit) q.set('limit', String(params.limit));
        if (params?.offset) q.set('offset', String(params.offset));
        return apiFetch(`${API_URL}/community/forum?${q.toString()}`);
    },

    getForumPost: (id: string) =>
        apiFetch(`${API_URL}/community/forum/${id}`),

    likeForumPost: (postId: string) =>
        apiFetch(`${API_URL}/community/forum/${postId}/like`, {
            method: "POST",
        }),

    addForumComment: (postId: string, content: string, parentId?: string) =>
        apiFetch(`${API_URL}/community/forum/${postId}/comment`, {
            method: "POST",
            body: JSON.stringify({ content, parentId }),
        }),

    likeForumComment: (commentId: string) =>
        apiFetch(`${API_URL}/community/forum/comments/${commentId}/like`, {
            method: "POST",
        }),

    // Hubs, Stats, etc.
    getHubs: () => apiFetch(`${API_URL}/community/hubs`),

    getStats: () => apiFetch(`${API_URL}/community/stats`),

    checkDuplicate: (data: { title: string; content: string; category: string }) =>
        apiFetch(`${API_URL}/community/forum/check-duplicate`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    checkRelevance: (title: string, content: string) =>
        apiFetch(`${API_URL}/ai/check-relevance`, {
            method: "POST",
            body: JSON.stringify({ title, content }),
        }),

    searchSimilarPosts: (q: string) =>
        apiFetch(`${API_URL}/community/forum/search?q=${encodeURIComponent(q)}`),

    // Specialized data
    getMentors: (params?: { limit?: number; offset?: number }) => {
        const q = new URLSearchParams();
        if (params?.limit) q.set('limit', String(params.limit));
        if (params?.offset) q.set('offset', String(params.offset));
        return apiFetch(`${API_URL}/community/mentors?${q.toString()}`);
    },

    getEvents: (params?: { limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.limit) q.set('limit', String(params.limit));
        return apiFetch(`${API_URL}/community/events?${q.toString()}`);
    },

    getStories: (params?: { limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.limit) q.set('limit', String(params.limit));
        return apiFetch(`${API_URL}/community/stories?${q.toString()}`);
    },
};

// ─── Explore ─────────────────────────────────────────────────────────
export const exploreApi = {
    getAll: (params?: Record<string, string>) => {
        const query = params ? "?" + new URLSearchParams(params).toString() : "";
        return apiFetch(`${API_URL}/explore${query}`);
    },

    getUniversities: () =>
        apiFetch(`${API_URL}/explore/universities`),

    getCourses: () => apiFetch(`${API_URL}/explore/courses`),

    getScholarships: () =>
        apiFetch(`${API_URL}/explore/scholarships`),
};

// ─── Applications ─────────────────────────────────────────────────────
export const applicationApi = {
    create: (data: Record<string, unknown>) =>
        apiFetch(HttpApiPaths.auth.createApplication(), {
            method: "POST",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiFetch(HttpApiPaths.auth.applicationById(id), {
            method: "DELETE",
        }),
};

// ─── AI Tools ─────────────────────────────────────────────────────────
export const aiApi = {
    sopReview: (data: Record<string, unknown>) =>
        apiFetch(`${API_URL}/ai/sop-analysis`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    sopHumanize: (text: string) =>
        apiFetch(`${API_URL}/ai/humanize-sop`, {
            method: "POST",
            body: JSON.stringify({ text }),
        }),

    admitPredictor: (data: Record<string, unknown>) =>
        apiFetch(`${API_URL}/ai/predict-admission`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    gradeConverter: (data: Record<string, unknown>) =>
        apiFetch(`${API_URL}/ai/convert-grades`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    gradeAnalyzer: (data: Record<string, unknown>) =>
        apiFetch(`${API_URL}/ai/analyze-grades`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    loanEligibility: (data: Record<string, unknown>) =>
        apiFetch(`${API_URL}/ai/eligibility-check`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    compareUniversities: (uni1: string, uni2: string) =>
        apiFetch(`${API_URL}/ai/compare-universities`, {
            method: "POST",
            body: JSON.stringify({ uni1, uni2 }),
        }),

    compareShortlist: (shortlist: Array<{ name: string; course: string }>, profile: { bachelors?: string; workExp?: string; gpa?: string }) =>
        apiFetch(`${API_URL}/ai/compare-shortlist`, {
            method: "POST",
            body: JSON.stringify({ shortlist, profile }),
        }),

    searchAdvice: (query: string, type: 'university' | 'course', context?: any) =>
        apiFetch(`${API_URL}/ai/search-advice`, {
            method: "POST",
            body: JSON.stringify({ query, type, context }),
        }),

    suggestTags: (title: string) =>
        apiFetch(`${API_URL}/ai/suggest-tags`, {
            method: "POST",
            body: JSON.stringify({ title }),
        }),

    // Always use relative path; the Next.js rewrite proxy routes to the backend.
    aiSearch: (data: Record<string, unknown>) =>
        apiFetch(`${API_URL}/ai/search`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    saveVisaReport: (data: Record<string, unknown>) =>
        apiFetch(`${API_URL}/ai/visa-interview/save-report`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// ─── Reference Data ───────────────────────────────────────────────────
export const referenceApi = {
    getBanks: () => apiFetch(HttpApiPaths.reference.banks()),
    getCountries: () =>
        apiFetch(HttpApiPaths.reference.countries()),
    getUniversities: () =>
        apiFetch(HttpApiPaths.reference.universities()),
};

// ─── Onboarding ───────────────────────────────────────────────────────
export const onboardingApi = {
    submit: (data: Record<string, unknown>) =>
        apiFetch(HttpApiPaths.onboarding.root(), {
            method: "POST",
            body: JSON.stringify(data),
        }),

    getStatus: (userId: string) =>
        apiFetch(HttpApiPaths.onboarding.status(userId)),

    share: (data: { studentId: string; studentEmail: string; studentName: string; shareUrl: string }) =>
        apiFetch(HttpApiPaths.onboarding.share(), {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// ─── Referral ─────────────────────────────────────────────────────────
export const referralApi = {
    // Get user's referral code (or create one if doesn't exist)
    getMyCode: () =>
        apiFetch(`${API_URL}/referral/my-code`),

    // Get referral statistics
    getStats: () =>
        apiFetch(`${API_URL}/referral/stats`),

    // Get list of referrals
    getList: (status?: string) => {
        const query = status ? `?status=${status}` : '';
        return apiFetch(`${API_URL}/referral/list${query}`);
    },

    // Validate a referral code
    validateCode: (code: string) =>
        apiFetch(`${API_URL}/referral/validate/${code}`),

    // Record a new referral (when someone signs up with code)
    recordReferral: (data: { referralCode: string; referredUserId: string }) =>
        apiFetch(`${API_URL}/referral/record`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Send referral invite email
    sendInvite: (email: string) =>
        apiFetch(`${API_URL}/referral/invite`, {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),

    // Get referral leaderboard
    getLeaderboard: (limit = 10) =>
        apiFetch(`${API_URL}/referral/leaderboard?limit=${limit}`),

    // Record a visit to a referral link
    recordVisit: (code: string) =>
        apiFetch(`${API_URL}/referral/visit/${code}`, {
            method: 'POST',
        }),
};

// ─── Admin ────────────────────────────────────────────────────────────
export const adminApi = {
    // Stats
    getBlogStats: () =>
        apiFetch(HttpApiPaths.admin.blogsStats()),
    getApplicationStats: (bankId?: string) =>
        apiFetch(`${API_URL}/applications/admin/stats${bankId ? `?bankId=${bankId}` : ''}`),
    getPortfolioAnalysis: (bankId?: string) =>
        apiFetch(`${API_URL}/admin/applications/portfolio/analysis${bankId ? `?bankId=${bankId}` : ''}`),
    getComplianceReport: (bankId?: string) =>
        apiFetch(`${API_URL}/admin/applications/compliance/report${bankId ? `?bankId=${bankId}` : ''}`),

    // Blogs
    getBlogs: (params?: Record<string, string>) =>
        apiFetch(HttpApiPaths.admin.blogsAll(params)),
    bulkUpdateBlogStatus: (blogIds: string[], isPublished: boolean) =>
        fetch(HttpApiPaths.admin.blogsBulkStatus(), {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ blogIds, isPublished }),
        }).then(handleResponse),
    deleteBlog: (id: string) =>
        fetch(HttpApiPaths.admin.blogById(id), {
            method: "DELETE",
            headers: authHeaders(),
        }).then(handleResponse),
    createBlog: (data: any) =>
        apiFetch(HttpApiPaths.admin.blogsCreate(), {
            method: "POST",
            body: JSON.stringify(data),
        }),

    getUserStats: () =>
        apiFetch(HttpApiPaths.admin.usersStats()),

    // Users
    getUsers: (limit = 30, offset = 0, search = "", role = "") =>
        apiFetch(HttpApiPaths.admin.usersList(limit, offset, search, role)),
    updateUserRole: (email: string, role: string) =>
        apiFetch(HttpApiPaths.admin.makeAdmin(), {
            method: "POST",
            body: JSON.stringify({ email, role }),
        }),
    deleteUser: (id: string) =>
        apiFetch(HttpApiPaths.admin.userByAdminId(id), {
            method: "DELETE",
        }),
    getUserById: (id: string) =>
        apiFetch(HttpApiPaths.admin.userByAdminId(id), {
            method: "GET",
        }),

    // Applications
    getApplications: (params?: Record<string, string>) =>
        apiFetch(HttpApiPaths.admin.applicationsAll(params)),
    getApplication: (id: string) =>
        apiFetch(HttpApiPaths.admin.applicationById(id)),
    getApplicationTracking: (id: string) =>
        apiFetch(HttpApiPaths.admin.applicationTracking(id)),
    getApplicationDocuments: (id: string) =>
        apiFetch(HttpApiPaths.admin.applicationDocuments(id)),
    updateApplicationStatus: (id: string, data: Record<string, unknown>) =>
        apiFetch(HttpApiPaths.admin.applicationStatus(id), {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    updateApplication: (id: string, data: Record<string, unknown>) =>
        apiFetch(HttpApiPaths.admin.applicationUpdate(id), {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    aiReviewApplication: (id: string) =>
        apiFetch(HttpApiPaths.admin.applicationAiReview(id), {
            method: "POST",
        }),
    deleteApplication: (id: string) =>
        apiFetch(HttpApiPaths.admin.applicationDelete(id), {
            method: "DELETE",
        }),
    shareApplication: (id: string) =>
        apiFetch(HttpApiPaths.admin.applicationShare(id), {
            method: "POST",
        }),
    syncVaultDocuments: (id: string) =>
        apiFetch(HttpApiPaths.admin.applicationSyncVault(id), {
            method: "POST",
        }),

    // Community
    getCommunityStats: () =>
        apiFetch(HttpApiPaths.admin.communityStats()),
    getForumPosts: (limit = 20, offset = 0) =>
        apiFetch(HttpApiPaths.admin.forumPostsAdmin(limit, offset)),
    getMentors: () =>
        apiFetch(HttpApiPaths.admin.mentors()),
    createMentor: (data: any) =>
        apiFetch(HttpApiPaths.admin.mentorsAdminCreate(), {
            method: "POST",
            body: JSON.stringify(data),
        }),
    deleteMentor: (id: string) =>
        apiFetch(HttpApiPaths.admin.mentorAdminDelete(id), {
            method: "DELETE",
        }),
    getCommunityResources: (params?: Record<string, string>) =>
        apiFetch(HttpApiPaths.admin.communityResources(params)),
    createCommunityResource: (data: any) =>
        apiFetch(HttpApiPaths.admin.communityResourcesAdminCreate(), {
            method: "POST",
            body: JSON.stringify(data),
        }),
    deleteCommunityResource: (id: string) =>
        apiFetch(HttpApiPaths.admin.communityResourceAdminDelete(id), {
            method: "DELETE",
        }),
    togglePinForumPost: (id: string, isPinned: boolean) =>
        apiFetch(HttpApiPaths.admin.forumPostPin(id), {
            method: "PUT",
            body: JSON.stringify({ isPinned }),
        }),
    deleteForumPost: (id: string) =>
        apiFetch(HttpApiPaths.admin.forumPostDelete(id), {
            method: "DELETE",
        }),
    getAuditLogs: (limit = 20) =>
        apiFetch(HttpApiPaths.admin.matrixLogs(limit)),
    sendEmail: (data: { to?: string; subject: string; content: string; role?: string; isBulk?: boolean }) =>
        apiFetch(HttpApiPaths.admin.sendEmail(), {
            method: "POST",
            body: JSON.stringify(data),
        }),
    createUser: (data: any) =>
        apiFetch(HttpApiPaths.admin.usersCreate(), {
            method: "POST",
            body: JSON.stringify(data),
        }),
    updateUserDetails: (data: { email: string; firstName: string; lastName: string; phoneNumber: string; dateOfBirth: string }) =>
        apiFetch(HttpApiPaths.admin.usersUpdateDetails(), {
            method: "POST",
            body: JSON.stringify(data),
        }),

    updateUserStatus: (userId: string, status: string, rejectionReason?: string) =>
        apiFetch(HttpApiPaths.admin.usersUpdateStatus(), {
            method: "POST",
            body: JSON.stringify({ userId, status, rejectionReason }),
        }),

    getUserProfile: (email: string) =>
        apiFetch(HttpApiPaths.admin.usersProfile(), {
            method: "POST",
            body: JSON.stringify({ email }),
            headers: authHeaders(),
        }),

    addRemark: (id: string, data: { type: string; content: string }) =>
        apiFetch(HttpApiPaths.admin.applicationNotes(id), {
            method: 'POST',
            body: JSON.stringify(data),
            headers: authHeaders(),
        }),

    getRemarks: (id: string) =>
        apiFetch(HttpApiPaths.admin.applicationNotes(id), {
            headers: authHeaders(),
        }),

    verifyDocument: (applicationId: string, documentId: string, status: string, rejectionReason?: string) =>
        apiFetch(HttpApiPaths.admin.documentVerify(documentId), {
            method: 'PUT',
            body: JSON.stringify({ status, rejectionReason }),
            headers: authHeaders(),
        }),

    viewDocument: (applicationId: string, documentId: string): Promise<Blob> =>
        fetchBlob(HttpApiPaths.admin.applicationDocumentView(applicationId, documentId)),
};

// ─── Documents ────────────────────────────────────────────────────────
export const documentApi = {
    getUsersDocuments: (userId: string) =>
        apiFetch(HttpApiPaths.documents.byUserId(userId)),

    getUserDocuments: (userId: string) =>
        apiFetch(HttpApiPaths.documents.byUserId(userId)),

    delete: (userId: string, docType: string) =>
        apiFetch(HttpApiPaths.documents.byUserIdAndDocType(userId, docType), {
            method: "DELETE",
        }),

    initiateDigilocker: (userId: string, docType: string) => {
        // Redirect directly — backend handles the OAuth flow
        window.location.href = HttpApiPaths.documents.digilockerAuthorizeRedirect(userId, docType);
    },

    initiateDigiLockerPull: (userId: string, docType: string) =>
        apiFetch(HttpApiPaths.documents.digilockerInitiate(), {
            method: 'POST',
            body: JSON.stringify({ userId, docType }),
        }),

    syncFromDigilocker: (userId: string, docType: string) =>
        fetch(HttpApiPaths.documents.digilockerSync(), {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ userId, docType }),
        }).then(handleResponse),

    upload: (userId: string, docType: string, file: File, onProgress?: (progress: number) => void) => {
        return new Promise((resolve, reject) => {
            const token = (() => {
                if (typeof window === 'undefined') return null;
                return localStorage.getItem('agentAccessToken') || localStorage.getItem('staffAccessToken') || localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken');
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

            xhr.open('POST', HttpApiPaths.documents.upload());
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(form);
        });
    },

    ocrReverify: (userId: string, docType: string) => {
        return apiFetch(HttpApiPaths.documents.ocrReverify(), {
            method: 'POST',
            body: JSON.stringify({ userId, docType }),
        });
    },

    addRequirement: (userId: string, docType: string, docName?: string) =>
        apiFetch(HttpApiPaths.documents.requirement(), {
            method: 'POST',
            body: JSON.stringify({ userId, docType, docName }),
        }),

    /** Get a short-lived S3 presigned URL to view/preview a document. */
    getPresignedView: (userId: string, docType: string) =>
        apiFetch(HttpApiPaths.documents.presignedView(userId, docType)),

    /** Update student profile fields (e.g. from OCR extraction results). */
    updateProfile: (userId: string, updates: any) =>
        apiFetch(HttpApiPaths.onboarding.root(), {
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
        fetch(HttpApiPaths.chat.connect(), {
            method: "POST",
            headers: authHeaders(),
        }).then(handleResponse),

    getConversations: () =>
        fetch(HttpApiPaths.chat.conversations(), {
            headers: authHeaders(),
        }).then(handleResponse),

    getMessages: (conversationId: string) =>
        fetch(HttpApiPaths.chat.messages(conversationId), {
            headers: authHeaders(),
        }).then(handleResponse),

    staffStart: (customerPhone: string, email: string, name?: string) =>
        fetch(HttpApiPaths.chat.staffStart(), {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ customerPhone, email, name }),
        }).then(handleResponse),
};
// ─── Staff Profile (Intermediary Flow) ───────────────────────────────
export const staffProfileApi = {
    // List all profiles (with optional search / bankStatus filter)
    list: (params?: { search?: string; bankStatus?: string }) =>
        apiFetch(HttpApiPaths.staffProfiles.list(params)),

    // Check if a profile already exists for a linked user
    checkExists: (userId: string) =>
        apiFetch(HttpApiPaths.staffProfiles.check(userId)),

    // Create a staff profile linked to a website user
    create: (data: { linked_user_id: string; target_bank?: string; loan_type?: string; internal_notes?: string }) =>
        apiFetch(HttpApiPaths.staffProfiles.root(), {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Get a single profile with its documents
    get: (profileId: string) =>
        apiFetch(HttpApiPaths.staffProfiles.byId(profileId)),

    // Pull and attach all documents uploaded by the linked user
    fetchUserDocuments: (profileId: string) =>
        apiFetch(HttpApiPaths.staffProfiles.fetchDocuments(profileId), {
            method: 'POST',
        }),

    // Get documents currently attached to a profile
    getDocuments: (profileId: string) =>
        apiFetch(HttpApiPaths.staffProfiles.documents(profileId)),

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

            xhr.open('POST', HttpApiPaths.staffProfiles.documents(profileId));
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(form);
        });
    },

    // Update a document's status (also back-syncs to user's profile)
    updateDocumentStatus: (profileId: string, docId: string, status: string, rejectionReason?: string) =>
        apiFetch(HttpApiPaths.staffProfiles.documentStatus(profileId, docId), {
            method: 'PATCH',
            body: JSON.stringify({ status, rejection_reason: rejectionReason }),
        }),

    // Remove (detach) a document from the profile
    removeDocument: (profileId: string, docId: string) =>
        apiFetch(HttpApiPaths.staffProfiles.documentById(profileId, docId), {
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
        apiFetch(HttpApiPaths.staffProfiles.share(profileId), {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Get share history for a profile
    getShares: (profileId: string) =>
        apiFetch(HttpApiPaths.staffProfiles.shares(profileId)),

    // S3 Document Management
    // Get presigned URL for S3 upload
    getS3PresignedUrl: (userId: string, docType: string, fileName: string, fileType: string) =>
        apiFetch(HttpApiPaths.documents.presignedUrl(), {
            method: 'POST',
            body: JSON.stringify({ userId, docType, fileName, fileType }),
        }),

    // Complete S3 document upload (register in database)
    completeS3Upload: (userId: string, docId: string, docType: string, s3Key: string, s3Url: string, personType: string, employmentType?: string) =>
        apiFetch(HttpApiPaths.documents.completeUpload(), {
            method: 'POST',
            body: JSON.stringify({ userId, docId, docType, s3Key, s3Url, personType, employmentType }),
        }),

    // Fetch user documents from S3
    fetchUserS3Documents: (userId: string) =>
        apiFetch(HttpApiPaths.documents.userDocumentsLegacy(userId)),

    // Delete S3 document
    deleteS3Document: (docId: string) =>
        apiFetch(HttpApiPaths.documents.byDocId(docId), {
            method: 'DELETE',
        }),

    // Download document from S3
    downloadS3Document: (s3Key: string) =>
        apiFetch(HttpApiPaths.documents.download(), {
            method: 'POST',
            body: JSON.stringify({ s3Key }),
        }),

    // Verify S3 document
    verifyS3Document: (docId: string, status: string, rejectionReason?: string) =>
        apiFetch(HttpApiPaths.documents.verifyByDocId(docId), {
            method: 'PATCH',
            body: JSON.stringify({ status, rejection_reason: rejectionReason }),
        }),

    // Dashboard Activities
    logActivity: (data: { type: string; msg: string; icon: string; color: string }) =>
        apiFetch(HttpApiPaths.staffProfiles.activities(), {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getDashboardActivities: (limit = 15) =>
        apiFetch(HttpApiPaths.staffProfiles.dashboardActivities(limit)),

    getAllDashboardActivities: (opts: { limit?: number; offset?: number; type?: string; search?: string }) =>
        apiFetch(HttpApiPaths.staffProfiles.activitiesAll(opts)),

    // Share a student profile with a bank or the student (Step 4 of onboarding)
    shareProfile: (studentId: string, data: {
        recipientType: string;
        recipientName: string;
        recipientEmail: string;
        message?: string;
        sharedBy?: string;
        studentDetails?: any;
    }) =>
        apiFetch(HttpApiPaths.staffProfiles.shareProfile(studentId), {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getTodayDashboard: () =>
        apiFetch(HttpApiPaths.staffProfiles.today()),

    getDashboardSummary: () =>
        apiFetch(HttpApiPaths.staffProfiles.summary()),

    getRejectionAnalytics: (period?: string) =>
        apiFetch(HttpApiPaths.staffProfiles.rejections(period)),

    getSlaTracker: () =>
        apiFetch(HttpApiPaths.staffProfiles.sla()),

    globalSearch: (q: string) =>
        apiFetch(HttpApiPaths.staffProfiles.search(q)),

    getAiPredictionScore: (id: string) =>
        apiFetch(HttpApiPaths.staffProfiles.predict(id)),

    getDeadlineCalendar: () =>
        apiFetch(HttpApiPaths.staffProfiles.calendar()),
};

export const bankApi = {
    getIncomingFiles: (limit?: number, offset?: number) => apiFetch(HttpApiPaths.bank.incomingFiles(limit, offset)),
    logFile: (id: string, data: { lanNumber: string }) => apiFetch(HttpApiPaths.bank.logFile(id), { method: "POST", body: JSON.stringify(data) }),
    getDocuments: (applicationId: string) => apiFetch(HttpApiPaths.bank.documents(applicationId)),
    downloadDocumentsZip: (applicationId: string) => fetchBlob(HttpApiPaths.bank.documentsZip(applicationId)),
    submitDecision: (data: any) => apiFetch(HttpApiPaths.bank.decisions(), { method: "POST", body: JSON.stringify(data) }),
    raiseQuery: (data: any) => apiFetch(HttpApiPaths.bank.queries(), { method: "POST", body: JSON.stringify(data) }),
    confirmDisbursement: (data: any) => apiFetch(HttpApiPaths.bank.confirmDisbursement(), { method: "POST", body: JSON.stringify(data) }),
    conditionalSanction: (data: any) => apiFetch(HttpApiPaths.bank.conditionalSanctions(), { method: "POST", body: JSON.stringify(data) }),
    saveConditionalSanctions: (id: string, data: any) => apiFetch(HttpApiPaths.bank.saveConditionalSanctions(id), { method: "POST", body: JSON.stringify(data) }),
    partialSanction: (data: any) => apiFetch(HttpApiPaths.bank.partialSanctions(), { method: "POST", body: JSON.stringify(data) }),
    counterOffer: (data: any) => apiFetch(HttpApiPaths.bank.counterOffers(), { method: "POST", body: JSON.stringify(data) }),
    fileQualityScore: (data: any) => apiFetch(HttpApiPaths.bank.fileQualityScore(), { method: "POST", body: JSON.stringify(data) }),
    getChannelAnalytics: () => apiFetch(HttpApiPaths.bank.analyticsChannel()),
    getRejectionAnalytics: () => apiFetch(HttpApiPaths.bank.analyticsRejections()),
    getSlaTracker: () => apiFetch(HttpApiPaths.bank.slaTracker()),
    getLoanProducts: () => apiFetch(HttpApiPaths.bank.loanProducts()),
    createLoanProduct: (data: any) => apiFetch(HttpApiPaths.bank.loanProducts(), { method: "POST", body: JSON.stringify(data) }),
    updateLoanProduct: (id: string, data: any) => apiFetch(HttpApiPaths.bank.updateLoanProduct(id), { method: "PUT", body: JSON.stringify(data) }),
    getBranches: () => apiFetch(HttpApiPaths.bank.branches()),
    createBranch: (data: any) => apiFetch(HttpApiPaths.bank.branches(), { method: "POST", body: JSON.stringify(data) }),
    getOfficers: () => apiFetch(HttpApiPaths.bank.officers()),
    getFileDetail: (id: string) => apiFetch<any>(HttpApiPaths.bank.fileDetail(id)),
    lookupByLan: (lan: string) => apiFetch(HttpApiPaths.bank.lookupByLan(lan)),
    getMyFiles: (filters?: any) => apiFetch(HttpApiPaths.bank.myFiles(filters)),
    amendDecision: (decisionId: string, data: any) => apiFetch(HttpApiPaths.bank.amendDecision(decisionId), { method: "PUT", body: JSON.stringify(data) }),
    uploadSanctionLetter: (id: string, fileUrl: string) => apiFetch(HttpApiPaths.bank.sanctionLetter(id), { method: "POST", body: JSON.stringify({ fileUrl }) }),
    setRoi: (id: string, data: any) => apiFetch(HttpApiPaths.bank.roi(id), { method: "POST", body: JSON.stringify(data) }),
    setProcessingFee: (id: string, data: any) => apiFetch(HttpApiPaths.bank.fee(id), { method: "POST", body: JSON.stringify(data) }),
    updateProcessingFee: (id: string, data: any) => apiFetch(HttpApiPaths.bank.fee(id), { method: "PUT", body: JSON.stringify(data) }),
    getQueryThread: (queryId: string) => apiFetch(HttpApiPaths.bank.queryThread(queryId)),
    resolveQuery: (queryId: string) => apiFetch(HttpApiPaths.bank.resolveQuery(queryId), { method: "POST" }),
    getAnalyticsMetrics: () => apiFetch(HttpApiPaths.bank.analyticsMetrics()),
    exportCsv: () => apiFetch(HttpApiPaths.bank.exportCsv()),
    exportMis: () => apiFetch(HttpApiPaths.bank.exportMis()),
    getConsent: (applicationId: string) => apiFetch<any>(HttpApiPaths.bank.consent(applicationId)),
    recordConsent: (applicationId: string, data: any) => apiFetch<any>(HttpApiPaths.bank.consent(applicationId), { method: "POST", body: JSON.stringify(data) }),
};

// ─── Campaigns ─────────────────────────────────────────────────────────
export const campaignApi = {
    create: (data: any) => apiFetch(`${API_URL}/campaigns`, { method: "POST", body: JSON.stringify(data) }),
    getAll: (limit = 50, offset = 0) => apiFetch(`${API_URL}/campaigns?limit=${limit}&offset=${offset}`),
    getAudience: (filters: { studyDestination?: string; targetUniversity?: string } = {}) => {
        const q = new URLSearchParams();
        if (filters.studyDestination) q.set('studyDestination', filters.studyDestination);
        if (filters.targetUniversity) q.set('targetUniversity', filters.targetUniversity);
        return apiFetch(`${API_URL}/campaigns/audience?${q.toString()}`);
    },
    getById: (id: string) => apiFetch(`${API_URL}/campaigns/${id}`),
    delete: (id: string) => apiFetch(`${API_URL}/campaigns/${id}`, { method: "DELETE" }),
    queue: (id: string, recipientIds: string[]) => apiFetch(`${API_URL}/campaigns/${id}/queue`, { method: "POST", body: JSON.stringify({ recipientIds }) }),
    cancel: (id: string) => apiFetch(`${API_URL}/campaigns/${id}/cancel`, { method: "POST" }),
};

/** Shared REST path builders + staff-dashboard catalog (single source for URLs). */
export { HTTP_API_PREFIX, HttpApiPaths, staffDashboardApiCatalog } from "./http-api-paths";

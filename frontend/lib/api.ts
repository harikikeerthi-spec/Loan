/**
 * Centralized API client for all backend requests
 */

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
}

function authHeaders(): HeadersInit {
    const token = getToken();
    return token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || "API request failed");
    }
    return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────
export const authApi = {
    sendOtp: (email: string) =>
        fetch(`${API_URL}/auth/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        }).then(handleResponse),

    verifyOtp: (email: string, otp: string) =>
        fetch(`${API_URL}/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp }),
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
    getAll: (page = 1, limit = 10) =>
        fetch(`${API_URL}/blogs?page=${page}&limit=${limit}`).then(handleResponse),

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

    searchAdvice: (query: string, type: 'university' | 'course', context?: any) =>
        fetch(`${API_URL}/ai/search-advice`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ query, type, context }),
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
        fetch(`${API_URL}/onboarding`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    getStatus: (userId: string) =>
        fetch(`${API_URL}/onboarding/status/${userId}`, {
            headers: authHeaders(),
        }).then(handleResponse),
};

// ─── Admin ────────────────────────────────────────────────────────────
export const adminApi = {
    // Stats
    getBlogStats: () =>
        fetch(`${API_URL}/blogs/admin/stats`, { headers: authHeaders() }).then(handleResponse),
    getApplicationStats: () =>
        fetch(`${API_URL}/applications/admin/stats`, { headers: authHeaders() }).then(handleResponse),

    // Blogs
    getBlogs: (limit = 50, offset = 0) =>
        fetch(`${API_URL}/blogs/admin/all?limit=${limit}&offset=${offset}`, { headers: authHeaders() }).then(handleResponse),
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
        fetch(`${API_URL}/blogs`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    // Users
    getUsers: () =>
        fetch(`${API_URL}/users/admin/list`, { headers: authHeaders() }).then(handleResponse),
    updateUserRole: (email: string, role: string) =>
        fetch(`${API_URL}/users/make-admin`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ email, role }),
        }).then(handleResponse),

    // Applications
    getApplications: (params?: Record<string, string>) => {
        const query = params ? "?" + new URLSearchParams(params).toString() : "";
        return fetch(`${API_URL}/applications/admin/all${query}`, { headers: authHeaders() }).then(handleResponse);
    },
    updateApplicationStatus: (id: string, data: Record<string, unknown>) =>
        fetch(`${API_URL}/applications/admin/${id}/status`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    // Community
    getCommunityStats: () =>
        fetch(`${API_URL}/community/admin/stats`, { headers: authHeaders() }).then(handleResponse),
    getForumPosts: (limit = 20, offset = 0) =>
        fetch(`${API_URL}/community/admin/forum/posts?limit=${limit}&offset=${offset}`, { headers: authHeaders() }).then(handleResponse),
    getMentors: () =>
        fetch(`${API_URL}/community/mentors`, { headers: authHeaders() }).then(handleResponse),
    deleteForumPost: (id: string) =>
        fetch(`${API_URL}/community/forum/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        }).then(handleResponse),
    getAuditLogs: (limit = 20) =>
        fetch(`${API_URL}/blogs/super-admin/audit-logs?limit=${limit}`, { headers: authHeaders() }).then(handleResponse),
};

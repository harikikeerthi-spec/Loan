/**
 * Centralized API client for all backend requests
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
    getPosts: (topic?: string, page = 1) =>
        fetch(
            `${API_URL}/community/posts?${topic ? `topic=${topic}&` : ""}page=${page}`
        ).then(handleResponse),

    getPostBySlug: (slug: string) =>
        fetch(`${API_URL}/community/posts/${slug}`).then(handleResponse),

    createPost: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/community/posts`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

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

    checkRelevance: (title: string, content: string) =>
        fetch(`${API_URL}/ai/check-relevance`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ title, content }),
        }).then(handleResponse),
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
        fetch(`${API_URL}/ai/sop-review`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    admitPredictor: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/ai/admit-predictor`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(data),
        }).then(handleResponse),

    gradeConverter: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/ai/grade-converter`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }).then(handleResponse),

    loanEligibility: (data: Record<string, unknown>) =>
        fetch(`${API_URL}/ai/loan-eligibility`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

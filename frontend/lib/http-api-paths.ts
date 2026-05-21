/**
 * Single source of truth for `/api/*` paths (Next.js proxy → backend).
 * Use these builders everywhere so staff dashboard (and clients) stay in sync when routes change.
 */

export const HTTP_API_PREFIX = "/api" as const;

export type QueryRecord = Record<string, string | number | boolean | undefined | null>;

/** Query string from params; omits undefined / null / "". */
export function httpApiQuery(params: QueryRecord): string {
    const sp = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
        if (val === undefined || val === null || val === "") continue;
        sp.set(key, String(val));
    }
    const s = sp.toString();
    return s ? `?${s}` : "";
}

function enc(segment: string): string {
    return encodeURIComponent(segment);
}

export const HttpApiPaths = {
    auth: {
        sendOtp: () => `${HTTP_API_PREFIX}/auth/send-otp`,
        verifyOtp: () => `${HTTP_API_PREFIX}/auth/verify-otp`,
        firebase: () => `${HTTP_API_PREFIX}/auth/firebase`,
        refresh: () => `${HTTP_API_PREFIX}/auth/refresh`,
        logout: () => `${HTTP_API_PREFIX}/auth/logout`,
        dashboard: () => `${HTTP_API_PREFIX}/auth/dashboard`,
        dashboardData: () => `${HTTP_API_PREFIX}/auth/dashboard-data`,
        updateDetails: () => `${HTTP_API_PREFIX}/auth/update-details`,
        uploadDocument: () => `${HTTP_API_PREFIX}/auth/upload-document`,
        createApplication: () => `${HTTP_API_PREFIX}/auth/create-application`,
        applicationById: (id: string) => `${HTTP_API_PREFIX}/auth/application/${enc(id)}`,
    },

    reference: {
        banks: () => `${HTTP_API_PREFIX}/reference/banks`,
        countries: () => `${HTTP_API_PREFIX}/reference/countries`,
        universities: () => `${HTTP_API_PREFIX}/reference/universities`,
    },

    onboarding: {
        root: () => `${HTTP_API_PREFIX}/onboarding`,
        status: (userId: string) => `${HTTP_API_PREFIX}/onboarding/status/${enc(userId)}`,
        share: () => `${HTTP_API_PREFIX}/onboarding/share`,
    },

    documents: {
        byUserId: (userId: string) => `${HTTP_API_PREFIX}/documents/${enc(userId)}`,
        byUserIdAndDocType: (userId: string, docType: string) =>
            `${HTTP_API_PREFIX}/documents/${enc(userId)}/${enc(docType)}`,
        upload: () => `${HTTP_API_PREFIX}/documents/upload`,
        digilockerInitiate: () => `${HTTP_API_PREFIX}/documents/digilocker/initiate`,
        /** Full-page redirect URL for OAuth */
        digilockerAuthorizeRedirect: (userId: string, docType: string) =>
            `${HTTP_API_PREFIX}/digilocker/authorize${httpApiQuery({ userId, docType })}`,
        digilockerSync: () => `${HTTP_API_PREFIX}/digilocker/sync`,
        ocrReverify: () => `${HTTP_API_PREFIX}/documents/ocr-reverify`,
        requirement: () => `${HTTP_API_PREFIX}/documents/requirement`,
        presignedView: (userId: string, docType: string) =>
            `${HTTP_API_PREFIX}/documents/presigned-view/${enc(userId)}/${enc(docType)}`,
        streamView: (userId: string, docType: string) =>
            `${HTTP_API_PREFIX}/documents/view/${enc(userId)}/${enc(docType)}`,
        presignedUrl: () => `${HTTP_API_PREFIX}/documents/presigned-url`,
        completeUpload: () => `${HTTP_API_PREFIX}/documents/complete-upload`,
        userDocumentsLegacy: (userId: string) => `${HTTP_API_PREFIX}/documents/user/${enc(userId)}`,
        byDocId: (docId: string) => `${HTTP_API_PREFIX}/documents/${enc(docId)}`,
        download: () => `${HTTP_API_PREFIX}/documents/download`,
        verifyByDocId: (docId: string) => `${HTTP_API_PREFIX}/documents/${enc(docId)}/verify`,
    },

    staffProfiles: {
        list: (params?: { search?: string; bankStatus?: string }) =>
            `${HTTP_API_PREFIX}/staff-profiles${httpApiQuery({
                search: params?.search,
                bankStatus: params?.bankStatus,
            })}`,
        check: (userId: string) => `${HTTP_API_PREFIX}/staff-profiles/check/${enc(userId)}`,
        root: () => `${HTTP_API_PREFIX}/staff-profiles`,
        byId: (profileId: string) => `${HTTP_API_PREFIX}/staff-profiles/${enc(profileId)}`,
        fetchDocuments: (profileId: string) =>
            `${HTTP_API_PREFIX}/staff-profiles/${enc(profileId)}/fetch-documents`,
        documents: (profileId: string) =>
            `${HTTP_API_PREFIX}/staff-profiles/${enc(profileId)}/documents`,
        documentStatus: (profileId: string, docId: string) =>
            `${HTTP_API_PREFIX}/staff-profiles/${enc(profileId)}/documents/${enc(docId)}/status`,
        documentById: (profileId: string, docId: string) =>
            `${HTTP_API_PREFIX}/staff-profiles/${enc(profileId)}/documents/${enc(docId)}`,
        share: (profileId: string) =>
            `${HTTP_API_PREFIX}/staff-profiles/${enc(profileId)}/share`,
        shares: (profileId: string) =>
            `${HTTP_API_PREFIX}/staff-profiles/${enc(profileId)}/shares`,
        activities: () => `${HTTP_API_PREFIX}/staff-profiles/activities`,
        dashboardActivities: (limit: number) =>
            `${HTTP_API_PREFIX}/staff-profiles/dashboard/activities${httpApiQuery({ limit })}`,
        activitiesAll: (opts: { limit?: number; offset?: number; type?: string; search?: string }) =>
            `${HTTP_API_PREFIX}/staff-profiles/activities/all${httpApiQuery(opts)}`,
        shareProfile: (studentId: string) =>
            `${HTTP_API_PREFIX}/staff-profiles/share-profile/${enc(studentId)}`,
    },

    chat: {
        connect: () => `${HTTP_API_PREFIX}/chat/connect`,
        conversations: (role?: string) =>
            `${HTTP_API_PREFIX}/chat/conversations${role !== undefined ? httpApiQuery({ role }) : ""}`,
        messages: (conversationId: string) =>
            `${HTTP_API_PREFIX}/chat/messages/${enc(conversationId)}`,
        staffStart: () => `${HTTP_API_PREFIX}/chat/staff-start`,
    },

    admin: {
        blogsStats: () => `${HTTP_API_PREFIX}/blogs/admin/stats`,
        applicationsStats: () => `${HTTP_API_PREFIX}/applications/admin/stats`,
        blogsAll: (params?: Record<string, string>) => {
            const query = params ? "?" + new URLSearchParams(params).toString() : "";
            return `${HTTP_API_PREFIX}/blogs/admin/all${query}`;
        },
        blogsBulkStatus: () => `${HTTP_API_PREFIX}/blogs/admin/bulk-status`,
        blogById: (id: string) => `${HTTP_API_PREFIX}/blogs/${enc(id)}`,
        blogsCreate: () => `${HTTP_API_PREFIX}/blogs`,
        usersStats: () => `${HTTP_API_PREFIX}/users/admin/stats`,
        usersList: (limit: number, offset: number, search?: string, role?: string) =>
            `${HTTP_API_PREFIX}/users/admin/list${httpApiQuery({
                limit,
                offset,
                search: search || undefined,
                role: role || undefined,
            })}`,
        makeAdmin: () => `${HTTP_API_PREFIX}/users/make-admin`,
        userByAdminId: (id: string) => `${HTTP_API_PREFIX}/users/admin/${enc(id)}`,
        applicationsAll: (params?: Record<string, string>) => {
            const query = params ? "?" + new URLSearchParams(params).toString() : "";
            return `${HTTP_API_PREFIX}/applications/admin/all${query}`;
        },
        applicationById: (id: string) => `${HTTP_API_PREFIX}/applications/${enc(id)}`,
        applicationTracking: (id: string) => `${HTTP_API_PREFIX}/applications/admin/${enc(id)}/tracking`,
        applicationDocuments: (id: string) => `${HTTP_API_PREFIX}/applications/admin/${enc(id)}/documents`,
        applicationStatus: (id: string) => `${HTTP_API_PREFIX}/applications/admin/${enc(id)}/status`,
        applicationUpdate: (id: string) => `${HTTP_API_PREFIX}/applications/admin/${enc(id)}`,
        applicationAiReview: (id: string) => `${HTTP_API_PREFIX}/applications/admin/${enc(id)}/ai-review`,
        applicationDelete: (id: string) => `${HTTP_API_PREFIX}/applications/admin/${enc(id)}`,
        applicationShare: (id: string) => `${HTTP_API_PREFIX}/applications/admin/${enc(id)}/share`,
        applicationSyncVault: (id: string) => `${HTTP_API_PREFIX}/applications/admin/${enc(id)}/sync-vault`,
        communityStats: () => `${HTTP_API_PREFIX}/community/admin/stats`,
        forumPostsAdmin: (limit: number, offset: number) =>
            `${HTTP_API_PREFIX}/community/admin/forum/posts${httpApiQuery({ limit, offset })}`,
        mentors: () => `${HTTP_API_PREFIX}/community/mentors`,
        mentorsAdminCreate: () => `${HTTP_API_PREFIX}/community/admin/mentors`,
        mentorAdminDelete: (id: string) => `${HTTP_API_PREFIX}/community/admin/mentors/${enc(id)}`,
        communityResources: (params?: Record<string, string>) => {
            const query = params ? "?" + new URLSearchParams(params).toString() : "";
            return `${HTTP_API_PREFIX}/community/resources${query}`;
        },
        communityResourcesAdminCreate: () => `${HTTP_API_PREFIX}/community/admin/resources`,
        communityResourceAdminDelete: (id: string) =>
            `${HTTP_API_PREFIX}/community/admin/resources/${enc(id)}`,
        forumPostPin: (id: string) => `${HTTP_API_PREFIX}/community/admin/forum/posts/${enc(id)}/pin`,
        forumPostDelete: (id: string) => `${HTTP_API_PREFIX}/community/forum/${enc(id)}`,
        matrixLogs: (limit: number) =>
            `${HTTP_API_PREFIX}/blogs/admin/matrix-logs${httpApiQuery({ limit })}`,
        sendEmail: () => `${HTTP_API_PREFIX}/users/admin/send-email`,
        usersCreate: () => `${HTTP_API_PREFIX}/users/admin/create`,
        usersUpdateDetails: () => `${HTTP_API_PREFIX}/users/admin/update-details`,
        usersProfile: () => `${HTTP_API_PREFIX}/users/profile`,
        applicationNotes: (id: string) => `${HTTP_API_PREFIX}/applications/admin/${enc(id)}/notes`,
        documentVerify: (documentId: string) =>
            `${HTTP_API_PREFIX}/applications/admin/documents/${enc(documentId)}/verify`,
        applicationDocumentView: (applicationId: string, documentId: string) =>
            `${HTTP_API_PREFIX}/applications/admin/${enc(applicationId)}/documents/${enc(documentId)}/view`,
    },
} as const;

/** Metadata for tooling / docs — paths resolved via HttpApiPaths (sample params where needed). */
export const staffDashboardApiCatalog = [
    { key: "staffProfiles.logActivity", method: "POST" as const, resolve: () => HttpApiPaths.staffProfiles.activities() },
    { key: "staffProfiles.getDashboardActivities", method: "GET" as const, resolve: () => HttpApiPaths.staffProfiles.dashboardActivities(15) },
    { key: "staffProfiles.getAllDashboardActivities", method: "GET" as const, resolve: () => HttpApiPaths.staffProfiles.activitiesAll({}) },
    { key: "reference.countries", method: "GET" as const, resolve: () => HttpApiPaths.reference.countries() },
    { key: "admin.getUsers", method: "GET" as const, resolve: () => HttpApiPaths.admin.usersList(30, 0) },
    { key: "admin.getBlogStats", method: "GET" as const, resolve: () => HttpApiPaths.admin.blogsStats() },
    { key: "admin.getApplicationStats", method: "GET" as const, resolve: () => HttpApiPaths.admin.applicationsStats() },
    { key: "admin.getBlogs", method: "GET" as const, resolve: () => HttpApiPaths.admin.blogsAll({ limit: "100" }) },
    { key: "admin.getApplications", method: "GET" as const, resolve: () => HttpApiPaths.admin.applicationsAll({}) },
    { key: "admin.getForumPosts", method: "GET" as const, resolve: () => HttpApiPaths.admin.forumPostsAdmin(50, 0) },
    { key: "admin.getUserStats", method: "GET" as const, resolve: () => HttpApiPaths.admin.usersStats() },
    { key: "admin.updateApplicationStatus", method: "PUT" as const, resolve: () => `${HTTP_API_PREFIX}/applications/admin/:id/status` },
    { key: "admin.sendEmail", method: "POST" as const, resolve: () => HttpApiPaths.admin.sendEmail() },
    { key: "admin.getUserProfile", method: "POST" as const, resolve: () => HttpApiPaths.admin.usersProfile() },
    { key: "admin.createUser", method: "POST" as const, resolve: () => HttpApiPaths.admin.usersCreate() },
    { key: "admin.deleteUser", method: "DELETE" as const, resolve: () => `${HTTP_API_PREFIX}/users/admin/:id` },
    { key: "admin.deleteBlog", method: "DELETE" as const, resolve: () => `${HTTP_API_PREFIX}/blogs/:id` },
    { key: "admin.bulkUpdateBlogStatus", method: "POST" as const, resolve: () => HttpApiPaths.admin.blogsBulkStatus() },
    { key: "admin.deleteForumPost", method: "DELETE" as const, resolve: () => `${HTTP_API_PREFIX}/community/forum/:id` },
    { key: "admin.deleteApplication", method: "DELETE" as const, resolve: () => `${HTTP_API_PREFIX}/applications/admin/:id` },
    { key: "staffProfiles.checkExists", method: "GET" as const, resolve: () => `${HTTP_API_PREFIX}/staff-profiles/check/:userId` },
    { key: "staffProfiles.create", method: "POST" as const, resolve: () => HttpApiPaths.staffProfiles.root() },
    { key: "staffProfiles.shareProfile", method: "POST" as const, resolve: () => `${HTTP_API_PREFIX}/staff-profiles/share-profile/:studentId` },
    { key: "onboarding.submit", method: "POST" as const, resolve: () => HttpApiPaths.onboarding.root() },
    { key: "onboarding.share", method: "POST" as const, resolve: () => HttpApiPaths.onboarding.share() },
    { key: "documents.listByUser", method: "GET" as const, resolve: () => `${HTTP_API_PREFIX}/documents/:userId` },
    { key: "documents.addRequirement", method: "POST" as const, resolve: () => HttpApiPaths.documents.requirement() },
    { key: "documents.upload", method: "POST" as const, resolve: () => HttpApiPaths.documents.upload() },
    { key: "documents.delete", method: "DELETE" as const, resolve: () => `${HTTP_API_PREFIX}/documents/:userId/:docType` },
    { key: "documents.ocrReverify", method: "POST" as const, resolve: () => HttpApiPaths.documents.ocrReverify() },
    { key: "documents.presignedView", method: "GET" as const, resolve: () => `${HTTP_API_PREFIX}/documents/presigned-view/:userId/:docType` },
    { key: "documents.digilockerInitiate", method: "POST" as const, resolve: () => HttpApiPaths.documents.digilockerInitiate() },
    { key: "auth.uploadDocument", method: "POST" as const, resolve: () => HttpApiPaths.auth.uploadDocument() },
    { key: "chat.conversations", method: "GET" as const, resolve: () => HttpApiPaths.chat.conversations("staff") },
    { key: "chat.messages", method: "GET" as const, resolve: () => `${HTTP_API_PREFIX}/chat/messages/:conversationId` },
    { key: "chat.staffStart", method: "POST" as const, resolve: () => HttpApiPaths.chat.staffStart() },
    { key: "pullModal.usersList", method: "GET" as const, resolve: () => HttpApiPaths.admin.usersList(20, 0) },
    { key: "pullModal.staffProfiles.list", method: "GET" as const, resolve: () => HttpApiPaths.staffProfiles.list({}) },
    { key: "applicationDetail.documents", method: "GET" as const, resolve: () => `${HTTP_API_PREFIX}/documents/:userId` },
    { key: "kyc.updateProfile", method: "POST" as const, resolve: () => HttpApiPaths.onboarding.root() },
] as const;

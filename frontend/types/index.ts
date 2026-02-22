// Global TypeScript types for the Vidhya Loans application

export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    role?: "user" | "admin" | "super_admin";
    createdAt?: string;
}

export interface AuthTokenPayload {
    sub: string;
    email: string;
    role: string;
    exp?: number;
    iat?: number;
}

export interface LoginResponse {
    success: boolean;
    access_token: string;
    refresh_token?: string;
    userExists: boolean;
    firstName?: string;
    lastName?: string;
}

export interface LoanApplication {
    id: string;
    userId: string;
    bank: string;
    loanType: string;
    amount: number;
    status: string;
    purpose?: string;
    createdAt: string;
    updatedAt: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    coverImage?: string;
    author?: string;
    tags?: string[];
    published: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ForumPost {
    id: string;
    title: string;
    content: string;
    userId: string;
    author?: User;
    topic?: string;
    slug?: string;
    likes: number;
    likedByUser?: boolean;
    isPinned?: boolean;
    comments?: ForumComment[];
    _count?: { comments: number; likes: number };
    createdAt: string;
    updatedAt: string;
}

export interface ForumComment {
    id: string;
    content: string;
    userId: string;
    author?: User;
    postId: string;
    likes: number;
    likedByUser?: boolean;
    replies?: ForumComment[];
    createdAt: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}

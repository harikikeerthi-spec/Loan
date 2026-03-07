"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { authApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    mobile?: string;
    role?: string;
    goal?: string;
    studyDestination?: string;
    courseName?: string;
    targetUniversity?: string;
    intakeSeason?: string;
    bachelorsDegree?: string;
    workExp?: number;
    gpa?: number;
    entranceTest?: string;
    entranceScore?: string;
    englishTest?: string;
    englishScore?: string;
    budget?: string;
    loanAmount?: string;
    admitStatus?: string;
    pincode?: string;
    referralCode?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    login: (accessToken: string, userData?: Partial<AuthUser>) => void;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<boolean>;
    refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStoredUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem("authUser");
        return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
        return null;
    }
}

function getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
}

function getStoredRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialise from localStorage on mount
    useEffect(() => {
        const storedUser = getStoredUser();
        const storedToken = getStoredToken();

        if (storedUser && storedToken) {
            setUser(storedUser);
            setToken(storedToken);
        } else if (storedToken && !storedUser) {
            // Token exists but no user object — try to reconstruct from stored email
            const email = localStorage.getItem("userEmail");
            const userId = localStorage.getItem("userId");
            if (email && userId) {
                setUser({ id: userId, email });
            }
            setToken(storedToken);
        }

        setIsLoading(false);
    }, []);

    /** Re-fetch the latest user profile from the backend and update state */
    const refreshUser = useCallback(async (): Promise<void> => {
        const email = localStorage.getItem("userEmail");
        const accessToken = getStoredToken();
        if (!email || !accessToken) return;
        try {
            const data = await authApi.getDashboard(email) as {
                success?: boolean;
                user?: Partial<AuthUser>;
                data?: Partial<AuthUser>;
            };
            const freshUser = data?.user ?? data?.data ?? null;
            if (freshUser && (freshUser as AuthUser).email) {
                const updated: AuthUser = {
                    ...user,
                    ...(freshUser as AuthUser),
                };
                setUser(updated);
                localStorage.setItem("authUser", JSON.stringify(updated));
            }
        } catch (err) {
            console.warn("refreshUser failed:", err);
        }
    }, [user]);

    /** Called after a successful OTP verification / login */
    const login = useCallback(
        (
            accessToken: string,
            userData?: Partial<AuthUser>
        ) => {
            const email = userData?.email ?? localStorage.getItem("userEmail") ?? "";
            const newUser: AuthUser = {
                id: userData?.id ?? localStorage.getItem("userId") ?? "",
                email,
                firstName: userData?.firstName,
                lastName: userData?.lastName,
                role: userData?.role,
                ...userData,
            };

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("userEmail", email);
            if (newUser.id) localStorage.setItem("userId", newUser.id);
            localStorage.setItem("authUser", JSON.stringify(newUser));

            setToken(accessToken);
            setUser(newUser);
        },
        []
    );

    /** Attempt a silent token refresh; returns true on success */
    const refreshAuth = useCallback(async (): Promise<boolean> => {
        const storedRefreshToken = getStoredRefreshToken();
        if (!storedRefreshToken) return false;

        try {
            const data = (await authApi.refresh(storedRefreshToken)) as {
                access_token?: string;
                accessToken?: string;
            };
            const newToken = data.access_token ?? data.accessToken;
            if (!newToken) return false;

            localStorage.setItem("accessToken", newToken);
            setToken(newToken);
            return true;
        } catch {
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        const email = user?.email ?? localStorage.getItem("userEmail") ?? "";

        // Best-effort server logout
        if (email) {
            try {
                await authApi.logout(email);
            } catch {
                // ignore network errors on logout
            }
        }

        // Clear all auth state
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userId");
        localStorage.removeItem("authUser");

        setUser(null);
        setToken(null);
    }, [user]);

    const isAuthenticated = user !== null && !!getStoredToken();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    return (
        <AuthContext.Provider
            value={{ user, token, isAuthenticated, isAdmin, isLoading, login, logout, refreshAuth, refreshUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}

"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { usePathname } from "next/navigation";
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
    isBank: boolean;
    isStaff: boolean;
    isLoading: boolean;
    login: (accessToken: string, userData?: Partial<AuthUser>) => void;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<boolean>;
    refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Portal = "student" | "staff" | "admin" | "bank";

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
        };
    }
    if (portal === "staff") {
        return {
            token: "staffAccessToken",
            refreshToken: "staffRefreshToken",
            email: "staffUserEmail",
            userId: "staffUserId",
            user: "staffAuthUser",
        };
    }
    if (portal === "bank") {
        return {
            token: "bankAccessToken",
            refreshToken: "bankRefreshToken",
            email: "bankUserEmail",
            userId: "bankUserId",
            user: "bankAuthUser",
        };
    }
    if (portal === "agent") {
        return {
            token: "agentAccessToken",
            refreshToken: "agentRefreshToken",
            email: "agentUserEmail",
            userId: "agentUserId",
            user: "agentAuthUser",
        };
    }
    return {
        token: "accessToken",
        refreshToken: "refreshToken",
        email: "userEmail",
        userId: "userId",
        user: "authUser",
    };
}

function getStoredUser(portal: Portal): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
        const keys = getStorageKeys(portal);
        let raw = localStorage.getItem(keys.user);
        
        if (!raw) raw = localStorage.getItem("adminAuthUser");
        if (!raw) raw = localStorage.getItem("staffAuthUser");
        if (!raw) raw = localStorage.getItem("authUser");
        
        return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
        return null;
    }
}

function getStoredToken(portal: Portal): string | null {
    if (typeof window === "undefined") return null;
    const keys = getStorageKeys(portal);
    const token = localStorage.getItem(keys.token);
    
    if (token) return token;

    // Fallbacks for multi-portal access (e.g. admin using staff portal)
    const adminToken = localStorage.getItem("adminAccessToken");
    if (adminToken) return adminToken;

    const staffToken = localStorage.getItem("staffAccessToken");
    if (staffToken) return staffToken;
    
    return localStorage.getItem("accessToken");
}

function getStoredRefreshToken(portal: Portal): string | null {
    if (typeof window === "undefined") return null;
    const keys = getStorageKeys(portal);
    const token = localStorage.getItem(keys.refreshToken);
    
    if (token) return token;

    const adminRefresh = localStorage.getItem("adminRefreshToken");
    if (adminRefresh) return adminRefresh;

    const staffRefresh = localStorage.getItem("staffRefreshToken");
    if (staffRefresh) return staffRefresh;
    
    return localStorage.getItem("refreshToken");
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const portal = getPortalFromPathname(pathname);

    // Initialise from portal-specific localStorage on mount and route scope change
    useEffect(() => {
        setIsLoading(true);
        const keys = getStorageKeys(portal);
        const storedUser = getStoredUser(portal);
        const storedToken = getStoredToken(portal);

        if (storedUser && storedToken) {
            setUser(storedUser);
            setToken(storedToken);
            
            // If ID is missing, trigger a refresh immediately
            if (!storedUser.id) {
                setTimeout(() => refreshUser(), 100);
            }
        } else if (storedToken && !storedUser) {
            // Token exists but no user object — try to reconstruct from stored email
            const email = localStorage.getItem(keys.email);
            const userId = localStorage.getItem(keys.userId);
            if (email) {
                const partialUser = { id: userId || "", email };
                setUser(partialUser);
                setToken(storedToken);
                // Trigger full refresh since we only have partial data
                setTimeout(() => refreshUser(), 100);
            }
        } else {
            setUser(null);
            setToken(null);
        }

        setIsLoading(false);
    }, [portal]);

    /** Re-fetch the latest user profile from the backend and update state */
    const refreshUser = useCallback(async (): Promise<void> => {
        const keys = getStorageKeys(portal);
        const email = localStorage.getItem(keys.email);
        const accessToken = getStoredToken(portal);
        if (!email || !accessToken) return;
        try {
            const data = await authApi.getDashboard(email) as {
                success?: boolean;
                user?: Partial<AuthUser>;
                data?: Partial<AuthUser>;
            };
            const freshUser = data?.user ?? data?.data ?? null;
            if (freshUser && (freshUser as AuthUser).email) {
                setUser(prev => {
                    const updated: AuthUser = {
                        ...(prev as AuthUser),
                        ...(freshUser as AuthUser),
                        id: (freshUser as any).id || (freshUser as any)._id || prev?.id || localStorage.getItem(keys.userId) || ""
                    };
                    localStorage.setItem(keys.user, JSON.stringify(updated));
                    if (updated.id) localStorage.setItem(keys.userId, updated.id);
                    return updated;
                });
            }
        } catch (err) {
            console.warn("refreshUser failed:", err);
        }
    }, [portal]);

    /** Called after a successful OTP verification / login */
    const login = useCallback(
        (
            accessToken: string,
            userData?: Partial<AuthUser>
        ) => {
            const keys = getStorageKeys(portal);
            const email = userData?.email ?? localStorage.getItem(keys.email) ?? "";
            const newUser: AuthUser = {
                id: userData?.id ?? localStorage.getItem(keys.userId) ?? "",
                email,
                firstName: userData?.firstName,
                lastName: userData?.lastName,
                role: userData?.role,
                ...userData,
            };

            localStorage.setItem(keys.token, accessToken);
            localStorage.setItem(keys.email, email);
            if (newUser.id) localStorage.setItem(keys.userId, newUser.id);
            localStorage.setItem(keys.user, JSON.stringify(newUser));

            setToken(accessToken);
            setUser(newUser);
        },
        [portal]
    );

    /** Attempt a silent token refresh; returns true on success */
    const refreshAuth = useCallback(async (): Promise<boolean> => {
        const keys = getStorageKeys(portal);
        const storedRefreshToken = getStoredRefreshToken(portal);
        if (!storedRefreshToken) return false;

        try {
            const data = (await authApi.refresh(storedRefreshToken)) as {
                access_token?: string;
                accessToken?: string;
            };
            const newToken = data.access_token ?? data.accessToken;
            if (!newToken) return false;

            localStorage.setItem(keys.token, newToken);
            setToken(newToken);
            return true;
        } catch {
            return false;
        }
    }, [portal]);

    const logout = useCallback(async () => {
        const keys = getStorageKeys(portal);
        const email = user?.email ?? localStorage.getItem(keys.email) ?? "";

        // Best-effort server logout
        if (email) {
            try {
                await authApi.logout(email);
            } catch {
                // ignore network errors on logout
            }
        }

        // Clear current portal auth state only
        localStorage.removeItem(keys.token);
        localStorage.removeItem(keys.refreshToken);
        localStorage.removeItem(keys.email);
        localStorage.removeItem(keys.userId);
        localStorage.removeItem(keys.user);

        setUser(null);
        setToken(null);
    }, [user, portal]);

    const isAuthenticated = user !== null && !!token;
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isBank = user?.role === 'bank' || user?.role === 'partner_bank';
    const isStaff = user?.role === 'staff' || isAdmin; // Admin can also be treated as staff

    return (
        <AuthContext.Provider
            value={{ user, token, isAuthenticated, isAdmin, isBank, isStaff, isLoading, login, logout, refreshAuth, refreshUser }}
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

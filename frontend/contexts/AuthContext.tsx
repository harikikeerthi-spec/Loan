"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { authApi, subscribeToTokenChange, notifyTokenChange } from "@/lib/api";

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
    bankId?: string;
    bankName?: string;
    fatherName?: string;
    fatherPhone?: string;
    fatherEmail?: string;
    motherName?: string;
    motherPhone?: string;
    motherEmail?: string;
    coApplicantName?: string;
    coApplicantRelation?: string;
    coApplicantPhone?: string;
    coApplicantEmail?: string;
    coApplicantIncome?: number | string;
    family?: any;
    coApplicant?: any;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isBank: boolean;
    isStaff: boolean;
    isAgent: boolean;
    isLoading: boolean;
    login: (accessToken: string, userData?: Partial<AuthUser> & { refresh_token?: string }) => void;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<boolean>;
    refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    const router = useRouter();
    const portal = getPortalFromPathname(pathname);

    // Subscribe to token updates from apiFetch (silent refreshes)
    useEffect(() => {
        const unsubscribe = subscribeToTokenChange((newToken) => {
            setToken(newToken);
        });
        return unsubscribe;
    }, []);

    // Handle session expiry without a full page reload
    useEffect(() => {
        const onSessionExpired = (event: Event) => {
            const loginPath = (event as CustomEvent<{ loginPath: string }>).detail?.loginPath || "/login";
            setUser(null);
            setToken(null);
            router.replace(`${loginPath}?expired=true`);
        };

        window.addEventListener("auth:session-expired", onSessionExpired);
        return () => window.removeEventListener("auth:session-expired", onSessionExpired);
    }, [router]);

    // Restore session from localStorage — trust cached tokens, no refresh on load
    useEffect(() => {
        const keys = getStorageKeys(portal);
        const storedUser = getStoredUser(portal);
        const storedToken = getStoredToken(portal);

        if (storedUser && storedToken) {
            setUser(storedUser);
            setToken(storedToken);
        } else if (storedToken && !storedUser) {
            const email = localStorage.getItem(keys.email);
            const userId = localStorage.getItem(keys.userId);
            if (email) {
                setUser({ id: userId || "", email });
                setToken(storedToken);
            } else {
                setUser(null);
                setToken(null);
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
                    // Merge, but only overwrite with non-empty values from the fresh fetch
                    // to avoid wiping fields like phoneNumber/dateOfBirth with empty strings
                    function mergeField<T>(fresh: T, existing: T): T {
                        if (fresh !== undefined && fresh !== null && fresh !== '') return fresh;
                        return existing;
                    }
                    const updated: AuthUser = {
                        ...(prev as AuthUser),
                        id: mergeField((freshUser as any).id || (freshUser as any)._id, prev?.id) || localStorage.getItem(keys.userId) || '',
                        email: mergeField(freshUser.email, prev?.email) || email,
                        firstName: mergeField(freshUser.firstName, prev?.firstName),
                        lastName: mergeField(freshUser.lastName, prev?.lastName),
                        phoneNumber: mergeField(freshUser.phoneNumber, prev?.phoneNumber),
                        dateOfBirth: mergeField(freshUser.dateOfBirth, prev?.dateOfBirth),
                        role: mergeField(freshUser.role, prev?.role),
                        intakeSeason: mergeField((freshUser as any).intakeSeason, prev?.intakeSeason),
                        studyDestination: mergeField((freshUser as any).studyDestination, prev?.studyDestination),
                        courseName: mergeField((freshUser as any).courseName, prev?.courseName),
                        targetUniversity: mergeField((freshUser as any).targetUniversity, prev?.targetUniversity),
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
            userData?: Partial<AuthUser> & { refresh_token?: string }
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
            if (userData?.refresh_token) {
                localStorage.setItem(keys.refreshToken, userData.refresh_token);
            }
            localStorage.setItem(keys.email, email);
            if (newUser.id) localStorage.setItem(keys.userId, newUser.id);
            localStorage.setItem(keys.user, JSON.stringify(newUser));

            notifyTokenChange(accessToken);

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
                refresh_token?: string;
            };
            const newToken = data.access_token ?? data.accessToken;
            if (!newToken) return false;

            localStorage.setItem(keys.token, newToken);
            if (data.refresh_token) {
                localStorage.setItem(keys.refreshToken, data.refresh_token);
            }
            notifyTokenChange(newToken);
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

        notifyTokenChange(null);

        setUser(null);
        setToken(null);
    }, [user, portal]);

    const isAuthenticated = user !== null && !!token;
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isBank = user?.role === 'bank' || user?.role === 'partner_bank';
    const isStaff = user?.role === 'staff' || isAdmin; // Admin can also be treated as staff
    const isAgent = user?.role === 'agent' || user?.role === 'partner_agent' || isAdmin;

    return (
        <AuthContext.Provider
            value={{ user, token, isAuthenticated, isAdmin, isBank, isStaff, isAgent, isLoading, login, logout, refreshAuth, refreshUser }}
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

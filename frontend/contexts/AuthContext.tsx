"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, AuthTokenPayload } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (token: string, userData: Partial<User>) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): AuthTokenPayload | null {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const login = useCallback((accessToken: string, userData: Partial<User>) => {
        localStorage.setItem("accessToken", accessToken);
        if (userData.email) localStorage.setItem("userEmail", userData.email);
        if (userData.firstName) localStorage.setItem("firstName", userData.firstName);
        if (userData.lastName) localStorage.setItem("lastName", userData.lastName);

        const decoded = parseJwt(accessToken);
        const mergedUser: User = {
            id: decoded?.sub || userData.id || "",
            email: userData.email || decoded?.email || "",
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: (decoded?.role as User["role"]) || "user",
        };

        setToken(accessToken);
        setUser(mergedUser);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("firstName");
        localStorage.removeItem("lastName");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        const storedToken = localStorage.getItem("accessToken");
        if (!storedToken) {
            setIsLoading(false);
            return;
        }

        const decoded = parseJwt(storedToken);
        if (!decoded) {
            logout();
            setIsLoading(false);
            return;
        }

        // Check expiration
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            logout();
            setIsLoading(false);
            return;
        }

        const email = localStorage.getItem("userEmail") || decoded.email;
        try {
            const res = await fetch(`${API_URL}/auth/dashboard`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${storedToken}`,
                },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.user) {
                    const u = data.user;
                    localStorage.setItem("userId", u.id);
                    localStorage.setItem("firstName", u.firstName || "");
                    localStorage.setItem("lastName", u.lastName || "");
                    setUser({
                        id: u.id,
                        email: u.email,
                        firstName: u.firstName,
                        lastName: u.lastName,
                        phoneNumber: u.phoneNumber,
                        dateOfBirth: u.dateOfBirth,
                        role: decoded.role as User["role"],
                    });
                }
            }
        } catch {
            // If API fails, still use token data
            setUser({
                id: decoded.sub,
                email: email,
                firstName: localStorage.getItem("firstName") || undefined,
                lastName: localStorage.getItem("lastName") || undefined,
                role: decoded.role as User["role"],
            });
        }

        setToken(storedToken);
        setIsLoading(false);
    }, [logout]);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const isAuthenticated = !!user && !!token;
    const isAdmin =
        user?.role === "admin" || user?.role === "super_admin";

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated,
                isAdmin,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

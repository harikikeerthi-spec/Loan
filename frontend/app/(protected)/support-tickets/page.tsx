"use client";

import UserSupportTicketsView from "@/components/UserSupportTicketsView";
import { useAuth } from "@/contexts/AuthContext";

export default function UserSupportTicketsPage() {
    const { user } = useAuth();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-16">
            <UserSupportTicketsView
                userRole="student"
                userInfo={{
                    id: user?.id,
                    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Student',
                    email: user?.email
                }}
            />
        </div>
    );
}

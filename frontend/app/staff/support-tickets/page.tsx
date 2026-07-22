"use client";

import UserSupportTicketsView from "@/components/UserSupportTicketsView";
import { useAuth } from "@/contexts/AuthContext";

export default function StaffSupportTicketsPage() {
    const { user } = useAuth();

    return (
        <div className="max-w-[1400px] mx-auto animate-fade-in pb-12">
            <UserSupportTicketsView
                userRole="staff"
                userInfo={{
                    id: user?.id,
                    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Staff Member',
                    email: user?.email
                }}
            />
        </div>
    );
}

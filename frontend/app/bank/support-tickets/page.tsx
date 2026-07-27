"use client";

import UserSupportTicketsView from "@/components/UserSupportTicketsView";
import { useAuth } from "@/contexts/AuthContext";

export default function BankSupportTicketsPage() {
    const { user } = useAuth();

    return (
        <div className="w-full space-y-6 animate-fade-in">
            <UserSupportTicketsView
                userRole="bank"
                userInfo={{
                    id: user?.id,
                    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Bank Partner',
                    email: user?.email
                }}
            />
        </div>
    );
}

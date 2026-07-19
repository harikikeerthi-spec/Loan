"use client";

import { useAuth } from "@/contexts/AuthContext";
import UserSupportTicketsView from "@/components/UserSupportTicketsView";

export default function BankSupportTicketsPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <UserSupportTicketsView
                userRole="bank"
                userInfo={{
                    id: user?.id,
                    name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
                    email: user?.email,
                }}
            />
        </div>
    );
}

"use client";

import UserSupportTicketsView from "@/components/UserSupportTicketsView";
import { useAuth } from "@/contexts/AuthContext";

export default function BankSupportTicketsPage() {
    const { user } = useAuth();

    return (
        <div className="max-w-[1400px] mx-auto animate-fade-in p-6 pb-12">
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

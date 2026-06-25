"use client";

import { use } from "react";
import StandaloneApplicationView from "@/components/staff/StandaloneApplicationView";

export default function BankDecisionsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <StandaloneApplicationView id={id} activeTab="bankdecisions" />;
}

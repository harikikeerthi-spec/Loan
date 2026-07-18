"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, parseISO } from "date-fns";
import { adminApi } from "@/lib/api";
import { PageHeader, StatusBadge, PriorityTag, Spinner, EmptyState } from "@/components/bank/SharedUI";

interface KanbanCard {
    id: string;
    applicationNumber: string;
    lanNumber: string | null;
    firstName: string;
    lastName: string;
    universityName: string;
    amount: number;
    status: string;
    stage: string;
    priority: "high" | "medium" | "low";
    daysInStage: number;
    createdAt: string;
    tags?: string;
}

export default function KanbanBoardPage() {
    const [mounted, setMounted] = useState(false);
    const [currentBankId, setCurrentBankId] = useState("idfc");
    const [applications, setApplications] = useState<KanbanCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
    const [selectedTagFilter, setSelectedTagFilter] = useState("");

    // Derived unique list of all tags present in current bank applications
    const allUniqueTags = useMemo(() => {
        const set = new Set<string>();
        applications.forEach(app => {
            if (app.tags) {
                app.tags.split(",").forEach((t: string) => {
                    const clean = t.trim();
                    if (clean) set.add(clean);
                });
            }
        });
        return Array.from(set);
    }, [applications]);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem("selectedBank") || localStorage.getItem("selectedBank");
            if (saved) setCurrentBankId(saved);
        }
    }, []);

    const fetchApplications = async (bankId: string) => {
        setLoading(true);
        try {
            const res: any = await adminApi.getApplications({ bank: bankId });
            if (res && res.success) {
                const raw = res.data || [];
                // Map API applications to our Kanban Card schema with fallback values
                const mapped: KanbanCard[] = raw
                    .filter((app: any) => !["submitted", "pending", "draft", "docs_received", "staff_verified", "application_submitted"].includes(app.status))
                    .map((app: any) => {
                    // Estimate stage based on LAN and status
                    let estimatedStage = "incoming";
                    if (app.status === "disbursed" || app.status === "disbursement_confirmed") {
                        estimatedStage = "closed";
                    } else if (app.status === "approved" || app.status === "sanctioned" || app.status === "rejected") {
                        estimatedStage = "decided";
                    } else if (app.lanNumber) {
                        estimatedStage = app.stage === "under_review" ? "review" : "logged";
                    }

                    // Estimate priority
                    const priority = app.lanNumber ? "high" : (app.amount > 1500000 ? "high" : "medium");

                    // Estimate days in current stage
                    const stageDate = app.lanEnteredAt || app.submittedAt || app.createdAt || new Date().toISOString();
                    const days = differenceInDays(new Date(), parseISO(stageDate)) || 0;

                    return {
                        id: app.id,
                        applicationNumber: app.applicationNumber || `APP-${app.id.substring(0, 6)}`,
                        lanNumber: app.lanNumber || null,
                        firstName: app.firstName || "Anonymous",
                        lastName: app.lastName || "Applicant",
                        universityName: app.universityName || "Global University",
                        amount: app.amount || 0,
                        status: app.status || "pending",
                        stage: app.stage || estimatedStage,
                        priority: priority as any,
                        daysInStage: days < 0 ? 0 : days,
                        createdAt: app.createdAt || new Date().toISOString(),
                        tags: app.tags || ""
                    };
                });
                setApplications(mapped);
            }
        } catch (err) {
            console.error("Failed to load applications for Kanban:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchApplications(currentBankId);
        }
    }, [currentBankId, mounted]);

    const handleRefresh = () => {
        fetchApplications(currentBankId);
    };

    // Columns structure
    const columns = [
        { id: "incoming", title: "Incoming Queue", icon: "download", color: "border-amber-100 bg-amber-50/10 text-amber-700" },
        { id: "logged", title: "Logged Files", icon: "assignment", color: "border-indigo-100 bg-indigo-50/10 text-indigo-700" },
        { id: "review", title: "Under Review", icon: "rate_review", color: "border-blue-100 bg-blue-50/10 text-blue-700" },
        { id: "decided", title: "Decided Files", icon: "gavel", color: "border-emerald-100 bg-emerald-50/10 text-emerald-700" },
        { id: "closed", title: "Closed Portfolio", icon: "archive", color: "border-purple-100 bg-purple-50/10 text-purple-700" }
    ];

    // Filter cards by search keyword
    const filteredCards = useMemo(() => {
        return applications.filter(card => {
            const matchesSearch = 
                `${card.firstName} ${card.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
                (card.lanNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                card.applicationNumber.toLowerCase().includes(search.toLowerCase()) ||
                card.universityName.toLowerCase().includes(search.toLowerCase());
            
            if (!matchesSearch) return false;

            if (selectedTagFilter) {
                const tagsList = card.tags ? card.tags.split(",").map((t: string) => t.trim()) : [];
                if (!tagsList.includes(selectedTagFilter)) return false;
            }

            return true;
        });
    }, [applications, search, selectedTagFilter]);

    // Handle Drag & Drop logic
    const onDragStart = (e: React.DragEvent, cardId: string) => {
        setDraggedCardId(cardId);
        e.dataTransfer.setData("text/plain", cardId);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = async (e: React.DragEvent, targetStage: string) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData("text/plain") || draggedCardId;
        if (!cardId) return;

        // Local state update for immediate feedback
        let updatedCard: KanbanCard | undefined;
        const newApps = applications.map(app => {
            if (app.id === cardId) {
                let status = app.status;
                let lanNumber = app.lanNumber;
                let stage = targetStage;

                // Adjust status and LAN automatically based on column placement
                if (targetStage === "incoming") {
                    status = "pending";
                    if (!app.lanNumber) {
                        lanNumber = null;
                    }
                } else if (targetStage === "logged") {
                    status = "processing";
                    if (!lanNumber) {
                        lanNumber = `LAN-${currentBankId.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
                    }
                } else if (targetStage === "review") {
                    status = "processing";
                    stage = "under_review";
                    if (!lanNumber) {
                        lanNumber = `LAN-${currentBankId.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
                    }
                } else if (targetStage === "decided") {
                    status = "approved"; // Default to approved on move to decided
                } else if (targetStage === "closed") {
                    status = "disbursed";
                }

                updatedCard = { ...app, status, lanNumber, stage, daysInStage: 0 };
                return updatedCard;
            }
            return app;
        });

        setApplications(newApps);
        setDraggedCardId(null);

        // Persist change to database via backend update
        if (updatedCard) {
            try {
                await adminApi.updateApplication(cardId, {
                    stage: updatedCard.stage,
                    status: updatedCard.status,
                    lanNumber: updatedCard.lanNumber,
                    remarks: `[Kanban Flow]: Shifted portfolio card to stage "${targetStage.toUpperCase()}"`
                });
            } catch (err) {
                console.error("Failed to persist card move on backend:", err);
            }
        }
    };

    if (!mounted) return null;

    return (
        <div className="p-8 lg:p-12 space-y-8 max-w-[1600px] mx-auto relative z-10">
            {/* Header */}
            <PageHeader 
                title="Application Kanban Board" 
                description="Manage, drag, and monitor loan processing pipelines across multiple appraisal stages."
                moduleName="Pipeline Kanban"
                icon="view_kanban"
                actionSlot={
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select
                            value={selectedTagFilter}
                            onChange={(e) => setSelectedTagFilter(e.target.value)}
                            className="px-4 py-2.5 bg-white/70 backdrop-blur-md border border-purple-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all text-gray-700 font-display"
                        >
                            <option value="">All Tags</option>
                            {allUniqueTags.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Search folders, student, LAN..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white/70 backdrop-blur-md border border-purple-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                        </div>
                        <button 
                            onClick={handleRefresh}
                            className="px-4 py-2.5 border border-purple-100 bg-white/70 hover:bg-white text-[10px] font-black uppercase tracking-widest text-[#6605c7] rounded-xl shadow-sm transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-xs">sync</span> Sync Pipeline
                        </button>
                    </div>
                }
            />

            {/* Kanban Columns Grid */}
            {loading ? (
                <div className="h-[500px] flex items-center justify-center">
                    <Spinner message="Synchronizing file board..." />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 items-start">
                    {columns.map(col => {
                        // Gather cards in this column
                        const cardsInColumn = filteredCards.filter(card => {
                            if (col.id === "incoming") return card.stage === "incoming" || (!card.lanNumber && !["approved", "sanctioned", "rejected", "disbursed", "disbursement_confirmed"].includes(card.status));
                            if (col.id === "logged") return card.stage === "logged";
                            if (col.id === "review") return card.stage === "review" || card.stage === "under_review";
                            if (col.id === "decided") return card.stage === "decided" || (["approved", "sanctioned", "rejected"].includes(card.status) && card.status !== "disbursed" && card.status !== "disbursement_confirmed");
                            if (col.id === "closed") return card.stage === "closed" || card.status === "disbursed" || card.status === "disbursement_confirmed";
                            return false;
                        });

                        // Calculate total portfolio value in this stage
                        const totalValue = cardsInColumn.reduce((sum, c) => sum + c.amount, 0);

                        return (
                            <div 
                                key={col.id}
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, col.id)}
                                className="flex flex-col h-[75vh] min-h-[500px] rounded-3xl border border-purple-100/50 bg-white/40 backdrop-blur-md overflow-hidden shadow-sm shadow-purple-500/5"
                            >
                                {/* Column Header */}
                                <div className="p-4 border-b border-purple-50 flex items-center justify-between bg-white/50">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-[#6605c7]">{col.icon}</span>
                                        <span className="text-[11.5px] font-black uppercase tracking-wider text-gray-800 font-display">
                                            {col.title}
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#6605c7]/10 text-[#6605c7]">
                                        {cardsInColumn.length}
                                    </span>
                                </div>

                                {/* Summary details */}
                                <div className="px-4 py-2 border-b border-purple-50/50 flex justify-between items-center bg-gray-50/30 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                    <span>Portfolio value</span>
                                    <span className="text-gray-700 font-black font-mono">₹{totalValue.toLocaleString()}</span>
                                </div>

                                {/* Cards List container */}
                                <div className="flex-1 p-3.5 space-y-3 overflow-y-auto no-scrollbar custom-scrollbar min-h-0 bg-white/10">
                                    <AnimatePresence initial={false}>
                                        {cardsInColumn.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-purple-100/20 rounded-2xl">
                                                <span className="material-symbols-outlined text-gray-200 text-3xl mb-1">dashboard_customize</span>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Empty stage</p>
                                                <p className="text-[9px] text-gray-400 mt-0.5 leading-relaxed">Drag folder here to transition.</p>
                                            </div>
                                        ) : (
                                            cardsInColumn.map(card => (
                                                <div
                                                    key={card.id}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, card.id)}
                                                    className="p-4 bg-white/90 border border-purple-50/80 rounded-2xl shadow-sm hover:shadow-md hover:border-[#6605c7]/20 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden"
                                                >
                                                    {/* Accent border on active dragged */}
                                                    {draggedCardId === card.id && (
                                                        <div className="absolute inset-0 border-2 border-[#6605c7] rounded-2xl pointer-events-none" />
                                                    )}

                                                    {/* Header: LAN / Applicant Name */}
                                                    <div className="flex justify-between items-start gap-1">
                                                        <span className="text-[9px] font-black uppercase text-[#6605c7] bg-purple-50 px-1.5 py-0.5 rounded">
                                                            {card.lanNumber ? `LAN: ${card.lanNumber.split("-").pop()}` : "NO LAN"}
                                                        </span>
                                                        <PriorityTag priority={card.priority} />
                                                    </div>

                                                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-tight mt-2 leading-snug">
                                                        {card.firstName} {card.lastName}
                                                    </h4>
                                                    <p className="text-[9.5px] text-gray-400 font-semibold truncate mt-0.5">
                                                        {card.universityName}
                                                    </p>
                                                    {/* Tag Pills */}
                                                    {card.tags && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {card.tags.split(",").map((t: string) => t.trim()).filter(Boolean).map((tag: string) => (
                                                                <span key={tag} className="text-[8px] bg-purple-50 text-purple-700 font-black px-1.5 py-0.5 rounded border border-purple-100/50">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Quantum Details */}
                                                    <div className="mt-3 flex items-baseline justify-between border-t border-purple-50/50 pt-2.5">
                                                        <div>
                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Sought Amt</span>
                                                            <span className="text-xs font-black text-gray-900">₹{card.amount.toLocaleString()}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">File Age</span>
                                                            <span className="text-[10px] font-bold text-gray-500 font-mono">
                                                                {card.daysInStage} {card.daysInStage === 1 ? "day" : "days"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Footer Status Badge */}
                                                    <div className="mt-3 flex items-center justify-between">
                                                        <StatusBadge status={card.status} />
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {/* Quick shift controller triggers for accessibility / tablet flow */}
                                                            <button 
                                                                title="Shift Stage"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const currentIndex = columns.findIndex(c => c.id === col.id);
                                                                    const nextIndex = (currentIndex + 1) % columns.length;
                                                                    const mockEvent = {
                                                                        preventDefault: () => {},
                                                                        dataTransfer: { getData: () => card.id }
                                                                    } as any;
                                                                    onDrop(mockEvent, columns[nextIndex].id);
                                                                }}
                                                                className="w-5 h-5 rounded bg-purple-50 text-[#6605c7] hover:bg-[#6605c7] hover:text-white flex items-center justify-center transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-[12px] font-bold">arrow_forward</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

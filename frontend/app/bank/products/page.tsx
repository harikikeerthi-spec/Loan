"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bankApi } from "@/lib/api";
import { PageHeader, Spinner, EmptyState } from "@/components/bank/SharedUI";

interface Product {
    id: string;
    name: string;
    interestRate: number; // Base ROI
    processingFee: number; // in %
    maxAmount: number; // Max loan amount in Lakhs
    status: "active" | "suspended" | "draft" | string;
    collateralRequired: boolean;
}

export default function LoanProducts() {
    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal state for adding a product
    const [showAddModal, setShowAddModal] = useState(false);
    const [productName, setProductName] = useState("");
    const [interestRate, setInterestRate] = useState("9.50");
    const [processingFee, setProcessingFee] = useState("1.00");
    const [maxAmount, setMaxAmount] = useState("75"); // In Lakhs
    const [collateralRequired, setCollateralRequired] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Modal state for editing a product's rates
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editRoi, setEditRoi] = useState("");
    const [editFee, setEditFee] = useState("");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res: any = await bankApi.getLoanProducts();
            if (res && res.success && Array.isArray(res.data)) {
                // Parse products, attach mock status/collateral if missing
                const parsed = res.data.map((p: any, idx: number) => ({
                    id: p.id || String(idx),
                    name: p.name || "Education Loan Product",
                    interestRate: p.interestRate || p.roi || 9.25,
                    processingFee: p.processingFee || 1.0,
                    maxAmount: p.maxAmount || 50,
                    status: p.status || "active",
                    collateralRequired: p.collateralRequired !== undefined ? p.collateralRequired : false
                }));
                setProducts(parsed);
            } else {
                setFallbackData();
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
            setFallbackData();
        } finally {
            setLoading(false);
        }
    };

    const setFallbackData = () => {
        setProducts([
            { id: "1", name: "Prime Global Study Abroad (Collateral-Free)", interestRate: 9.25, processingFee: 0.75, maxAmount: 75, status: "active", collateralRequired: false },
            { id: "2", name: "Premier Domestic University Special", interestRate: 8.95, processingFee: 0.50, maxAmount: 40, status: "active", collateralRequired: false },
            { id: "3", name: "Executive MBA Accelerated Loan", interestRate: 9.80, processingFee: 1.00, maxAmount: 30, status: "active", collateralRequired: false },
            { id: "4", name: "Global Study Secured Scheme (Collateral Required)", interestRate: 8.50, processingFee: 0.50, maxAmount: 150, status: "active", collateralRequired: true },
            { id: "5", name: "Vocational Study Support Tier-2", interestRate: 10.50, processingFee: 1.50, maxAmount: 15, status: "suspended", collateralRequired: false },
        ]);
    };

    useEffect(() => {
        if (mounted) {
            fetchProducts();
        }
    }, [mounted]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            (p.name || "").toLowerCase().includes(search.toLowerCase())
        );
    }, [products, search]);

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productName.trim()) return;
        setSubmitting(true);

        try {
            const payload = {
                name: productName.trim(),
                interestRate: parseFloat(interestRate),
                processingFee: parseFloat(processingFee),
                maxAmount: parseFloat(maxAmount),
                collateralRequired,
                status: "active"
            };

            await bankApi.createLoanProduct(payload);
            setShowAddModal(false);
            setProductName("");
            fetchProducts();
        } catch (err) {
            console.error("Failed to create product:", err);
            // Local state append for demo/fallback purposes
            setProducts(prev => [
                ...prev,
                {
                    id: String(prev.length + 1),
                    name: productName.trim(),
                    interestRate: parseFloat(interestRate),
                    processingFee: parseFloat(processingFee),
                    maxAmount: parseFloat(maxAmount),
                    status: "active",
                    collateralRequired
                }
            ]);
            setShowAddModal(false);
            setProductName("");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateRates = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        setUpdating(true);

        try {
            const id = editingProduct.id;
            const newRoi = parseFloat(editRoi);
            const newFee = parseFloat(editFee);

            // Update base settings
            await bankApi.setRoi(id, { interestRate: newRoi }).catch(() => {});
            await bankApi.updateProcessingFee(id, { processingFee: newFee }).catch(() => {});

            setShowEditModal(false);
            setEditingProduct(null);
            fetchProducts();
        } catch (err) {
            console.error("Failed to update product rates:", err);
            // Local state update fallback
            setProducts(prev => prev.map(p => 
                p.id === editingProduct.id 
                    ? { ...p, interestRate: parseFloat(editRoi), processingFee: parseFloat(editFee) } 
                    : p
            ));
            setShowEditModal(false);
            setEditingProduct(null);
        } finally {
            setUpdating(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="p-8 lg:p-12 space-y-8 max-w-7xl mx-auto relative z-10">
            {/* Page Header */}
            <PageHeader 
                title="Active Loan Products" 
                description="Configure education loan catalog products, baseline interest rates (ROI), maximum borrow thresholds, and compliance structures."
                moduleName="Module 12 • Product Matrix"
                icon="shopping_bag"
                actionSlot={
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Search products..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white/70 backdrop-blur-md border border-purple-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                        </div>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="px-5 py-2.5 bg-[#6605c7] hover:bg-[#8b24e5] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-purple-500/25 transition-all flex items-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-sm font-black">add_circle</span> Add Product
                        </button>
                    </div>
                }
            />

            {loading ? (
                <Spinner message="Synchronizing catalog..." />
            ) : filteredProducts.length === 0 ? (
                <EmptyState message="No active or drafted products matched your search." />
            ) : (
                /* Products Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((p, idx) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05, duration: 0.5 }}
                            className="glass-card bg-white/80 backdrop-blur-md border border-purple-50 hover:border-purple-200 p-6 rounded-3xl relative overflow-hidden group shadow-lg shadow-purple-900/[0.01]"
                        >
                            {/* Accent line depending on active/inactive status */}
                            <div className={`absolute top-0 left-0 w-full h-1.5 ${p.status === "active" ? "bg-gradient-to-r from-purple-600 to-indigo-600" : "bg-gray-300"}`} />

                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div>
                                    <h3 className="text-base font-black text-gray-900 uppercase tracking-tight truncate max-w-[200px]" title={p.name}>
                                        {p.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                            p.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                                        }`}>
                                            {p.status}
                                        </span>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                            {p.collateralRequired ? "Collateral Required" : "Collateral-Free"}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#6605c7] shrink-0">
                                    <span className="material-symbols-outlined text-lg">payments</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 border-t border-purple-50/50 pt-4 mb-5">
                                <div className="text-center border-r border-purple-50/50">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Base ROI</p>
                                    <p className="text-sm font-black text-gray-800 mt-1 italic font-display">{p.interestRate}%</p>
                                </div>
                                <div className="text-center border-r border-purple-50/50">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Proc. Fee</p>
                                    <p className="text-sm font-black text-gray-800 mt-1 italic font-display">{p.processingFee}%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Max Amount</p>
                                    <p className="text-sm font-black text-[#6605c7] mt-1 italic font-display">₹{p.maxAmount}L</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingProduct(p);
                                        setEditRoi(p.interestRate.toString());
                                        setEditFee(p.processingFee.toString());
                                        setShowEditModal(true);
                                    }}
                                    className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-[#6605c7] text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-xs">tune</span> Adjust Rates
                                </button>
                            </div>

                            <span className="material-symbols-outlined text-8xl absolute -right-6 -bottom-6 text-purple-900/[0.012] group-hover:scale-110 transition-transform duration-700 pointer-events-none select-none">shopping_bag</span>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Loan Product Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-md w-full z-10 relative overflow-hidden"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-1 uppercase tracking-tight">Create Product</h3>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-6">Define parameters for a new study loan catalog item.</p>

                            <form onSubmit={handleCreateProduct} className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Product Name</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. Executive MBA Global Program Tier-1"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Base ROI (%)</label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            required
                                            value={interestRate}
                                            onChange={(e) => setInterestRate(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Proc. Fee (%)</label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            required
                                            value={processingFee}
                                            onChange={(e) => setProcessingFee(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Max Amount (₹L)</label>
                                        <input 
                                            type="number"
                                            required
                                            value={maxAmount}
                                            onChange={(e) => setMaxAmount(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 py-2">
                                    <input 
                                        type="checkbox"
                                        id="collateral"
                                        checked={collateralRequired}
                                        onChange={(e) => setCollateralRequired(e.target.checked)}
                                        className="w-4 h-4 text-[#6605c7] border-gray-300 rounded focus:ring-[#6605c7]/50"
                                    />
                                    <label htmlFor="collateral" className="text-[10px] font-black text-gray-600 uppercase tracking-wide cursor-pointer select-none">
                                        Requires Asset Collateral
                                    </label>
                                </div>

                                <div className="flex gap-4 pt-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3 bg-[#6605c7] hover:bg-[#8b24e5] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/10 transition-all flex items-center justify-center"
                                    >
                                        {submitting ? "Creating..." : "Save Product"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Adjust Rates Modal */}
            <AnimatePresence>
                {showEditModal && editingProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-sm w-full z-10 relative overflow-hidden"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-1 uppercase tracking-tight">Adjust Catalog Rates</h3>
                            <p className="text-[9.5px] font-black text-[#6605c7] uppercase tracking-widest mb-6 truncate max-w-[280px]" title={editingProduct.name}>
                                {editingProduct.name}
                            </p>

                            <form onSubmit={handleUpdateRates} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Base ROI (%)</label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            required
                                            value={editRoi}
                                            onChange={(e) => setEditRoi(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Proc. Fee (%)</label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            required
                                            value={editFee}
                                            onChange={(e) => setEditFee(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={updating}
                                        className="flex-1 py-3 bg-[#6605c7] hover:bg-[#8b24e5] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/10 transition-all flex items-center justify-center"
                                    >
                                        {updating ? "Saving..." : "Apply Rates"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

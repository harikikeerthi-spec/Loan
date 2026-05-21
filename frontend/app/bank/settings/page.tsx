"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export default function Settings() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    
    // Config states
    const [selectedTab, setSelectedTab] = useState<"products" | "branch" | "profile">("products");

    // Product Configurator States
    const [products, setProducts] = useState([
        { id: "1", name: "Scholar Loan (Premium)", baseRoi: "8.2%", floatSpread: "Floating", docs: ["Admission Letter", "Marksheet", "PAN Card"] },
        { id: "2", name: "Student Loan (Regular)", baseRoi: "9.5%", floatSpread: "Fixed", docs: ["Identity Proof", "Marksheet", "Co-applicant Income Proof"] },
        { id: "3", name: "CSIS Interest Subsidy", baseRoi: "0.0% (Subsidy)", floatSpread: "Floating", docs: ["Income Certificate", "Admission Letter", "Marksheet"] }
    ]);
    
    const [newProductName, setNewProductName] = useState("");
    const [newProductRoi, setNewProductRoi] = useState("");
    const [newProductType, setNewProductType] = useState("Floating");

    // Branch mapper states
    const [branchName, setBranchName] = useState("SBI — Hyderabad Main Branch");
    const [branchCode, setBranchCode] = useState("SBIN0002345");
    const [officers, setOfficers] = useState([
        { name: "Srinivas Rao", role: "Primary Underwriter", status: "Active" },
        { name: "Ananya Reddy", role: "Verification Officer", status: "Active" },
        { name: "Shahnawaz Kalneedi", role: "Disbursement Lead", status: "Active" }
    ]);

    // Bank detection helpers
    const currentBankId = typeof window !== "undefined" ? sessionStorage.getItem("selectedBank") : null;
    const currentBankName = useMemo(() => {
        if (!currentBankId) return user?.firstName || "SBI";
        const map: Record<string, string> = {
            auxilo: "Auxilo Finserve",
            avanse: "Avanse Financial",
            credila: "HDFC Credila",
            idfc: "IDFC FIRST Bank",
            poonawalla: "Poonawalla Fincorp",
        };
        return map[currentBankId] || currentBankId.toUpperCase();
    }, [currentBankId, user]);

    useEffect(() => {
        setMounted(true);
        // Set dynamic branch name based on bank
        setBranchName(`${currentBankName} — Corporate HQ & Hyderabad Branch`);
    }, [currentBankName, user]);

    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProductName || !newProductRoi) return;
        setProducts(prev => [
            ...prev,
            {
                id: Date.now().toString(),
                name: newProductName,
                baseRoi: newProductRoi + "%",
                floatSpread: newProductType,
                docs: ["Identity Proof", "Academic records"]
            }
        ]);
        setNewProductName("");
        setNewProductRoi("");
        alert("New Loan pricing product created and mapped!");
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 lg:p-12 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-10">
                
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-[#6605c7] bg-purple-50 p-2 rounded-xl">settings</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Config Panel</span>
                        </div>
                        <h1 className="text-4xl font-display font-black text-gray-900 tracking-tight italic uppercase">Portal Settings</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                            Pricing catalogs, branch nodes, and underwriting permissions for {currentBankName}
                        </p>
                    </div>
                </motion.div>

                {/* Sub-Tabs */}
                <div className="flex border-b border-gray-100 gap-8">
                    {[
                        { id: "products", label: "Loan Pricing Catalogs" },
                        { id: "branch", label: "Branch Mapping & Officers" },
                        { id: "profile", label: "Bank Security Node" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as any)}
                            className={`text-xs font-black uppercase tracking-[0.2em] pb-3 transition-all relative whitespace-nowrap ${
                                selectedTab === tab.id ? "text-[#6605c7] font-black" : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            {tab.label}
                            {selectedTab === tab.id && (
                                <motion.div layoutId="settingsTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6605c7]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Body Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* TAB: Products */}
                    {selectedTab === "products" && (
                        <>
                            {/* Products Grid */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-2">Loan Product Matrix</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-6">List of active pricing products published on student onboarding maps</p>

                                    <div className="space-y-4">
                                        {products.map((product) => (
                                            <div key={product.id} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center flex-wrap gap-4 text-left">
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-black text-gray-950 uppercase italic tracking-tight">{product.name}</h4>
                                                    <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">
                                                        Base ROI: {product.baseRoi} ({product.floatSpread})
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {product.docs.map((doc, i) => (
                                                            <span key={i} className="bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase">
                                                                {doc}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setProducts(prev => prev.filter(p => p.id !== product.id));
                                                        alert("Pricing product deactivated.");
                                                    }}
                                                    className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all"
                                                >
                                                    Deactivate
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Add Product Config Form */}
                            <div className="lg:col-span-4">
                                <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-md">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-2">Publish Pricing</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed mb-6">
                                        Create a new loan asset catalog, specifying base yield and index types.
                                    </p>

                                    <form onSubmit={handleAddProduct} className="space-y-4 text-left">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Product Name</label>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="e.g. Scholar Elite Plus"
                                                value={newProductName}
                                                onChange={(e) => setNewProductName(e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Yield Index Rate (%)</label>
                                            <input 
                                                type="number" 
                                                step="0.05"
                                                required
                                                placeholder="e.g. 8.45"
                                                value={newProductRoi}
                                                onChange={(e) => setNewProductRoi(e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Asset Interest Type</label>
                                            <select 
                                                value={newProductType}
                                                onChange={(e) => setNewProductType(e.target.value)}
                                                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-wider"
                                            >
                                                <option value="Floating">Floating Spread</option>
                                                <option value="Fixed">Fixed Yield</option>
                                            </select>
                                        </div>

                                        <button 
                                            type="submit" 
                                            className="w-full py-4 bg-[#6605c7] hover:bg-[#5204a0] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all mt-4"
                                        >
                                            Publish Catalog
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </>
                    )}

                    {/* TAB: Branch */}
                    {selectedTab === "branch" && (
                        <div className="lg:col-span-12 space-y-6">
                            <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm text-left">
                                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-2">Location Node Config</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-6">Details of local branch code mapping in SBI clearing houses</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-gray-100 pb-8">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Branch Name</label>
                                        <input 
                                            type="text" 
                                            value={branchName}
                                            onChange={(e) => setBranchName(e.target.value)}
                                            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Clearing Code (IFS/Swift)</label>
                                        <input 
                                            type="text" 
                                            value={branchCode}
                                            onChange={(e) => setBranchCode(e.target.value)}
                                            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 font-black">Authorized Underwriting Officers</h4>
                                    <button 
                                        onClick={() => {
                                            const name = prompt("Enter officer full name:") || "";
                                            const role = prompt("Enter underwriting role:") || "";
                                            if (name && role) {
                                                setOfficers(prev => [...prev, { name, role, status: "Active" }]);
                                            }
                                        }}
                                        className="px-4 py-2 bg-[#6605c7] text-white hover:bg-[#5204a0] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all"
                                    >
                                        Add Officer
                                    </button>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {officers.map((officer, i) => (
                                        <div key={i} className="py-4 flex justify-between items-center flex-wrap gap-4">
                                            <div>
                                                <div className="font-bold text-gray-900 uppercase italic">{officer.name}</div>
                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{officer.role}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-500 rounded-full text-[8px] font-black uppercase tracking-widest">
                                                    {officer.status}
                                                </span>
                                                <button 
                                                    onClick={() => {
                                                        setOfficers(prev => prev.filter(o => o.name !== officer.name));
                                                        alert("Officer permissions revoked.");
                                                    }}
                                                    className="text-rose-600 hover:text-rose-800 text-[10px] font-black uppercase tracking-widest italic"
                                                >
                                                    Revoke
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: Profile */}
                    {selectedTab === "profile" && (
                        <div className="lg:col-span-12 space-y-6">
                            <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm text-left">
                                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-2">Bank Security Credentials</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-6">Cryptographic keys, token limits, and webhook listeners</p>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">System API Token</span>
                                            <span className="font-mono text-xs font-bold text-gray-700">••••••••••••••••••••••••••••••••</span>
                                        </div>
                                        <button className="text-[9px] font-black text-purple-600 uppercase tracking-widest" onClick={() => alert("Simulating key regeneration...")}>Regenerate</button>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">Webhook Endpoint</span>
                                            <span className="font-mono text-xs font-bold text-purple-600">https://api.vidyaloans.com/v1/webhooks/bank/sbi</span>
                                        </div>
                                        <button className="text-[9px] font-black text-gray-500 uppercase tracking-widest" onClick={() => alert("Testing endpoint sync...")}>Ping Test</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { referenceApi, adminApi } from "@/lib/api";

interface BankPartner {
    id: string;
    name: string;
    shortName: string;
    country: string;
    type: string;
    loanTypes: string[];
    educationLoan: boolean;
    interestRateMin: number;
    interestRateMax: number;
    maxLoanAmount: string;
    collateralRequired: boolean;
    collateralFreeLimit: string;
    processingFee: string;
    processingTime: string;
    features: string[];
    website: string;
    contactNumber: string;
    email: string;
    logoUrl: string;
    isPopular: boolean;
}

export default function AdminBanksSection() {
    const [banks, setBanks] = useState<BankPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingBank, setEditingBank] = useState<BankPartner | null>(null);

    // Form states
    const [form, setForm] = useState({
        name: "",
        shortName: "",
        country: "India",
        type: "NBFC",
        loanTypes: ["Education Loan"],
        educationLoan: true,
        interestRateMin: 10.25,
        interestRateMax: 14.5,
        maxLoanAmount: "No Limit",
        collateralRequired: false,
        collateralFreeLimit: "",
        processingFee: "1% + GST",
        processingTime: "48 hours",
        features: ["100% Financing: Covers tuition fees, living costs, and travel expenses"],
        website: "",
        contactNumber: "",
        email: "",
        logoUrl: "",
        isPopular: false
    });

    const [featureInput, setFeatureInput] = useState("");

    const loadBanks = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await referenceApi.getBanks() as any;
            if (res?.success) {
                setBanks(res.data || []);
            } else {
                setError("Failed to fetch bank partners list");
            }
        } catch (err: any) {
            setError(err?.message || "Something went wrong fetching banks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBanks();
    }, []);

    const handleOpenAdd = () => {
        setEditingBank(null);
        setForm({
            name: "",
            shortName: "",
            country: "India",
            type: "NBFC",
            loanTypes: ["Education Loan"],
            educationLoan: true,
            interestRateMin: 10.25,
            interestRateMax: 14.5,
            maxLoanAmount: "No Limit",
            collateralRequired: false,
            collateralFreeLimit: "",
            processingFee: "1% + GST",
            processingTime: "48 hours",
            features: ["100% Financing: Covers tuition fees, living costs, and travel expenses"],
            website: "",
            contactNumber: "",
            email: "",
            logoUrl: "",
            isPopular: false
        });
        setFeatureInput("");
        setShowModal(true);
    };

    const handleOpenEdit = (bank: BankPartner) => {
        setEditingBank(bank);
        setForm({
            name: bank.name || "",
            shortName: bank.shortName || "",
            country: bank.country || "India",
            type: bank.type || "NBFC",
            loanTypes: bank.loanTypes || ["Education Loan"],
            educationLoan: bank.educationLoan !== false,
            interestRateMin: bank.interestRateMin || 10.25,
            interestRateMax: bank.interestRateMax || 14.5,
            maxLoanAmount: bank.maxLoanAmount || "No Limit",
            collateralRequired: !!bank.collateralRequired,
            collateralFreeLimit: bank.collateralFreeLimit || "",
            processingFee: bank.processingFee || "1% + GST",
            processingTime: bank.processingTime || "48 hours",
            features: bank.features || [],
            website: bank.website || "",
            contactNumber: bank.contactNumber || "",
            email: bank.email || "",
            logoUrl: bank.logoUrl || "",
            isPopular: !!bank.isPopular
        });
        setFeatureInput("");
        setShowModal(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete bank partner "${name}"?`)) return;
        try {
            const res = await adminApi.deleteBank(id) as any;
            if (res?.success) {
                alert("Bank partner deleted successfully!");
                loadBanks();
            } else {
                alert(res?.message || "Failed to delete bank partner");
            }
        } catch (err: any) {
            alert(err?.message || "Error deleting bank partner");
        }
    };

    const handleAddFeature = () => {
        if (!featureInput.trim()) return;
        setForm(prev => ({
            ...prev,
            features: [...prev.features, featureInput.trim()]
        }));
        setFeatureInput("");
    };

    const handleRemoveFeature = (index: number) => {
        setForm(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return alert("Bank Name is required");
        if (!form.shortName.trim()) return alert("Bank Short Name (slug) is required");

        const payload = {
            ...form,
            shortName: form.shortName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "")
        };

        try {
            let res: any;
            if (editingBank) {
                res = await adminApi.updateBank(editingBank.id, payload);
            } else {
                res = await adminApi.createBank(payload);
            }

            if (res?.success) {
                alert(editingBank ? "Bank partner updated successfully!" : "Bank partner created successfully!");
                setShowModal(false);
                loadBanks();
            } else {
                alert(res?.message || "Failed to save bank partner details");
            }
        } catch (err: any) {
            alert(err?.message || "Error saving bank partner details");
        }
    };

    const popularCount = banks.filter(b => b.isPopular).length;
    const nbfcCount = banks.filter(b => b.type === "NBFC").length;
    const avgMinRate = banks.length > 0 ? (banks.reduce((acc, b) => acc + (b.interestRateMin || 0), 0) / banks.length).toFixed(2) : "0.00";

    return (
        <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto pb-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Lending Bank Partners</h2>
                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">account_balance</span>
                        Configuring active financial institutions in the education loan network
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[16px]">add_business</span>
                    Add Bank Partner
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                    <p className="text-slate-500 text-[11px] font-medium mb-0.5">Total Bank Partners</p>
                    <p className="text-[20px] font-semibold text-slate-900">{loading ? "..." : banks.length}</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                    <p className="text-slate-500 text-[11px] font-medium mb-0.5">Popular Flag Active</p>
                    <p className="text-[20px] font-semibold text-indigo-600">{loading ? "..." : popularCount}</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                    <p className="text-slate-500 text-[11px] font-medium mb-0.5">Avg Min Interest Rate</p>
                    <p className="text-[20px] font-semibold text-emerald-600">{loading ? "..." : `${avgMinRate}% p.a.`}</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                    <p className="text-slate-500 text-[11px] font-medium mb-0.5">NBFC Specialists</p>
                    <p className="text-[20px] font-semibold text-amber-600">{loading ? "..." : nbfcCount}</p>
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500">error</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Table layout */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Registered Lenders</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Configured records active in system memory</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-5 py-3">Bank Details</th>
                                <th className="px-5 py-3">Short Name</th>
                                <th className="px-5 py-3">Institution Type</th>
                                <th className="px-5 py-3">ROI Spreads</th>
                                <th className="px-5 py-3">Max Loan</th>
                                <th className="px-5 py-3">Processing Fee</th>
                                <th className="px-5 py-3">Processing Time</th>
                                <th className="px-5 py-3">Popular</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-5 py-10 text-center text-slate-400 text-xs">
                                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                                        Fetching partners...
                                    </td>
                                </tr>
                            ) : banks.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-5 py-10 text-center text-slate-400 text-xs">
                                        No bank partners registered. Click "Add Bank Partner" to begin.
                                    </td>
                                </tr>
                            ) : (
                                banks.map((bank) => (
                                    <tr key={bank.id} className="hover:bg-slate-50/50 transition-colors text-xs font-medium">
                                        <td className="px-5 py-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded border border-slate-200 bg-white p-1 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                {bank.logoUrl ? (
                                                    <img src={bank.logoUrl} alt={bank.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-slate-400 text-sm">account_balance</span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 block">{bank.name}</span>
                                                <span className="text-[10px] text-slate-400 block">{bank.website || "No website"}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-mono text-[10px] text-slate-500">{bank.shortName}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                bank.type === "NBFC" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                                bank.type === "Private" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                                "bg-slate-50 text-slate-700 border border-slate-100"
                                            }`}>
                                                {bank.type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-900 font-bold">
                                            {bank.interestRateMin}% - {bank.interestRateMax}% p.a.
                                        </td>
                                        <td className="px-5 py-4 text-slate-900">{bank.maxLoanAmount}</td>
                                        <td className="px-5 py-4 text-slate-600">{bank.processingFee}</td>
                                        <td className="px-5 py-4 text-slate-600">{bank.processingTime}</td>
                                        <td className="px-5 py-4">
                                            {bank.isPopular ? (
                                                <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">No</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenEdit(bank)}
                                                    className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                                    title="Edit Partner"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bank.id, bank.name)}
                                                    className="p-1 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                                    title="Delete Partner"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-900 text-sm">
                                {editingBank ? `Edit Partner: ${editingBank.name}` : "Register New Bank Partner"}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {/* Section 1: Basic Info */}
                            <div>
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Basic Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Bank Name</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                            placeholder="e.g., Auxilo Finserve"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Short Name / Slug</label>
                                        <input
                                            type="text"
                                            value={form.shortName}
                                            onChange={e => setForm(p => ({ ...p, shortName: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))}
                                            placeholder="e.g., auxilo (lowercase alphanumeric)"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                            required
                                            disabled={!!editingBank}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Logo Image Path / URL</label>
                                        <input
                                            type="text"
                                            value={form.logoUrl}
                                            onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))}
                                            placeholder="e.g., /banks/auxilo.png"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Institution Type</label>
                                        <select
                                            value={form.type}
                                            onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        >
                                            <option value="Public">Public Sector Bank</option>
                                            <option value="Private">Private Sector Bank</option>
                                            <option value="NBFC">NBFC Specialist</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Website URL</label>
                                        <input
                                            type="url"
                                            value={form.website}
                                            onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                                            placeholder="https://example.com"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-6 mt-4">
                                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={form.isPopular}
                                                onChange={e => setForm(p => ({ ...p, isPopular: e.target.checked }))}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            Show as Popular
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Financial Criteria */}
                            <div>
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Financial Criteria</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Min ROI (% p.a.)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.interestRateMin}
                                            onChange={e => setForm(p => ({ ...p, interestRateMin: parseFloat(e.target.value) || 0 }))}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Max ROI (% p.a.)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.interestRateMax}
                                            onChange={e => setForm(p => ({ ...p, interestRateMax: parseFloat(e.target.value) || 0 }))}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Max Loan Amount</label>
                                        <input
                                            type="text"
                                            value={form.maxLoanAmount}
                                            onChange={e => setForm(p => ({ ...p, maxLoanAmount: e.target.value }))}
                                            placeholder="e.g., ₹40 Lakhs or No Limit"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Processing Fee</label>
                                        <input
                                            type="text"
                                            value={form.processingFee}
                                            onChange={e => setForm(p => ({ ...p, processingFee: e.target.value }))}
                                            placeholder="e.g., 1% + GST"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Processing / Approval Time</label>
                                        <input
                                            type="text"
                                            value={form.processingTime}
                                            onChange={e => setForm(p => ({ ...p, processingTime: e.target.value }))}
                                            placeholder="e.g., 48 hours or 3 days"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Collateral Free Limit</label>
                                        <input
                                            type="text"
                                            value={form.collateralFreeLimit}
                                            onChange={e => setForm(p => ({ ...p, collateralFreeLimit: e.target.value }))}
                                            placeholder="e.g., ₹40 Lakhs"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Key Features list */}
                            <div>
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Key Features</h4>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={featureInput}
                                            onChange={e => setFeatureInput(e.target.value)}
                                            placeholder="Add feature description..."
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddFeature}
                                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all cursor-pointer"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                                        {form.features.map((feat, index) => (
                                            <li key={index} className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded border border-slate-200 text-xs">
                                                <span className="truncate pr-4">{feat}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFeature(index)}
                                                    className="text-red-500 hover:text-red-700 text-xs cursor-pointer"
                                                >
                                                    Remove
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </form>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-slate-200 rounded text-xs text-slate-600 hover:bg-slate-100 transition-all font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition-all cursor-pointer"
                            >
                                {editingBank ? "Update Details" : "Register Partner"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

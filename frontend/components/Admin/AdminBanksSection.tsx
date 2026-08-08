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

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");

    // Quick ROI modal states
    const [showRoiModal, setShowRoiModal] = useState(false);
    const [roiBank, setRoiBank] = useState<BankPartner | null>(null);
    const [minRoiInput, setMinRoiInput] = useState<number>(9.55);
    const [maxRoiInput, setMaxRoiInput] = useState<number>(14.5);
    const [savingRoi, setSavingRoi] = useState(false);

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

    const handleOpenRoiModal = (bank: BankPartner) => {
        setRoiBank(bank);
        setMinRoiInput(bank.interestRateMin || 9.55);
        setMaxRoiInput(bank.interestRateMax || 14.5);
        setShowRoiModal(true);
    };

    const handleSaveRoi = async () => {
        if (!roiBank) return;
        if (minRoiInput <= 0 || maxRoiInput <= 0) {
            alert("ROI rates must be greater than 0");
            return;
        }
        if (minRoiInput > maxRoiInput) {
            alert("Min ROI cannot exceed Max ROI");
            return;
        }

        setSavingRoi(true);
        try {
            const res: any = await adminApi.updateBank(roiBank.id, {
                interestRateMin: minRoiInput,
                interestRateMax: maxRoiInput
            });
            if (res?.success) {
                alert(`ROI updated successfully for ${roiBank.name}! (${minRoiInput}% - ${maxRoiInput}% p.a.)`);
                setShowRoiModal(false);
                loadBanks();
            } else {
                alert(res?.message || "Failed to update ROI");
            }
        } catch (err: any) {
            alert(err?.message || "Error updating ROI");
        } finally {
            setSavingRoi(false);
        }
    };

    const handleAccessBank = (bank: BankPartner) => {
        localStorage.setItem("currentBankId", bank.shortName);
        localStorage.setItem("currentBankName", bank.name);
        localStorage.setItem("bankId", bank.shortName);
        window.open(`/bank/decisions?bankId=${encodeURIComponent(bank.shortName)}`, "_blank");
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

    const filteredBanks = banks.filter(bank => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query ||
            (bank.name || "").toLowerCase().includes(query) ||
            (bank.shortName || "").toLowerCase().includes(query);
        const matchesType = filterType === "all" || bank.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto pb-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Lending Bank Partners</h2>
                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">account_balance</span>
                        Configuring active financial institutions & interest rates in the education loan network
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
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
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Registered Lenders ({filteredBanks.length})</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Dynamic bank partner configuration & ROI management</p>
                    </div>
                    {/* Search & Filter Bar */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-[16px]">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search bank or code..."
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-medium"
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-700 cursor-pointer"
                        >
                            <option value="all">All Types</option>
                            <option value="Public">Public Sector</option>
                            <option value="Private">Private Sector</option>
                            <option value="NBFC">NBFC</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-5 py-3">Bank Details</th>
                                <th className="px-5 py-3">Short Code</th>
                                <th className="px-5 py-3">Type</th>
                                <th className="px-5 py-3">ROI Spreads (% p.a.)</th>
                                <th className="px-5 py-3">Max Loan</th>
                                <th className="px-5 py-3">Processing Fee</th>
                                <th className="px-5 py-3">Popular</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-xs">
                                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                                        Fetching dynamic partners...
                                    </td>
                                </tr>
                            ) : filteredBanks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-xs">
                                        No bank partners found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredBanks.map((bank) => (
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
                                        <td className="px-5 py-4 font-mono text-[10px] text-slate-500 font-bold">{bank.shortName}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${bank.type === "NBFC" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                                    bank.type === "Private" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                                        "bg-slate-50 text-slate-700 border border-slate-100"
                                                }`}>
                                                {bank.type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-900 font-bold bg-purple-50 border border-purple-100 text-purple-700 px-2 py-0.5 rounded text-[11px]">
                                                    {bank.interestRateMin}% - {bank.interestRateMax}%
                                                </span>
                                                <button
                                                    onClick={() => handleOpenRoiModal(bank)}
                                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-purple-100 text-purple-700 rounded text-[9.5px] font-bold transition-all border border-slate-200 cursor-pointer"
                                                    title="Set ROI Rates"
                                                >
                                                    Set ROI
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-900 font-medium">{bank.maxLoanAmount}</td>
                                        <td className="px-5 py-4 text-slate-600">{bank.processingFee}</td>
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
                                            <div className="flex justify-end items-center gap-2">
                                                <button
                                                    onClick={() => handleAccessBank(bank)}
                                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                                    title="Access Bank Underwriting Portal"
                                                >
                                                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                                    Access Bank
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(bank)}
                                                    className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                                    title="Edit Partner Details & ROI"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bank.id, bank.name)}
                                                    className="p-1 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                                    title="Delete Bank Partner"
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

            {/* Quick Set ROI Modal */}
            {showRoiModal && roiBank && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-5 animate-scale-in">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-purple-600 text-base">percent</span>
                                    Set Interest Rates (ROI)
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{roiBank.name} ({roiBank.shortName})</p>
                            </div>
                            <button
                                onClick={() => setShowRoiModal(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                                    Minimum ROI (% p.a.)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={minRoiInput}
                                    onChange={e => setMinRoiInput(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-purple-600 text-slate-900"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                                    Maximum ROI (% p.a.)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={maxRoiInput}
                                    onChange={e => setMaxRoiInput(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-purple-600 text-slate-900"
                                    required
                                />
                            </div>

                            <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-lg text-[11px] font-semibold text-purple-800">
                                Effective ROI spread: <strong>{minRoiInput}% - {maxRoiInput}% p.a.</strong>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowRoiModal(false)}
                                className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-all font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveRoi}
                                disabled={savingRoi}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                            >
                                {savingRoi ? "Saving ROI..." : "Save ROI Rates"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

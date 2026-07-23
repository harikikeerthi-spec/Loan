"use client";

import { useState, useEffect } from "react";
import { referenceApi } from "@/lib/api";

interface CountryItem {
    id: string;
    name: string;
    code: string;
    flag?: string;
    region?: string;
    popularForStudy?: boolean;
    isActive?: boolean;
    createdAt?: string;
}

const REGIONS = [
    "North America",
    "Europe",
    "Oceania",
    "Asia",
    "Middle East",
    "Latin America",
    "Africa",
    "Global"
];

const PRESET_FLAGS: Record<string, string> = {
    US: "🇺🇸",
    GB: "🇬🇧",
    CA: "🇨🇦",
    AU: "🇦🇺",
    DE: "🇩🇪",
    IE: "🇮🇪",
    NZ: "🇳🇿",
    FR: "🇫🇷",
    SG: "🇸🇬",
    JP: "🇯🇵",
    KR: "🇰🇷",
    IT: "🇮🇹",
    ES: "🇪🇸",
    AE: "🇦🇪",
    NL: "🇳🇱",
    SE: "🇸🇪",
    CH: "🇨🇭",
    IN: "🇮🇳",
};

export default function AdminCountriesSection() {
    const [countries, setCountries] = useState<CountryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [regionFilter, setRegionFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingCountry, setEditingCountry] = useState<CountryItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // Form inputs
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [flag, setFlag] = useState("🌐");
    const [region, setRegion] = useState("Europe");
    const [popularForStudy, setPopularForStudy] = useState(true);
    const [isActive, setIsActive] = useState(true);

    const loadCountries = async () => {
        setLoading(true);
        try {
            const res: any = await referenceApi.getCountries();
            if (res && res.data) {
                setCountries(res.data);
            }
        } catch (e) {
            console.error("Failed to fetch countries:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCountries();
    }, []);

    const openAddModal = () => {
        setEditingCountry(null);
        setName("");
        setCode("");
        setFlag("🌐");
        setRegion("Europe");
        setPopularForStudy(true);
        setIsActive(true);
        setFormError("");
        setShowModal(true);
    };

    const openEditModal = (c: CountryItem) => {
        setEditingCountry(c);
        setName(c.name || "");
        setCode(c.code || "");
        setFlag(c.flag || PRESET_FLAGS[c.code?.toUpperCase()] || "🌐");
        setRegion(c.region || "Global");
        setPopularForStudy(c.popularForStudy ?? true);
        setIsActive(c.isActive ?? true);
        setFormError("");
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setFormError("Country name is required");
            return;
        }
        setSaving(true);
        setFormError("");

        const newId = editingCountry ? editingCountry.id : `cnt-${Date.now()}`;
        const payload: CountryItem = {
            id: newId,
            name: name.trim(),
            code: code.trim().toUpperCase() || name.trim().substring(0, 2).toUpperCase(),
            flag: flag.trim() || PRESET_FLAGS[code.trim().toUpperCase()] || "🌐",
            region,
            popularForStudy,
            isActive
        };

        // Optimistic UI state update (0ms UI latency)
        if (editingCountry) {
            setCountries(prev => prev.map(c => c.id === editingCountry.id ? payload : c));
        } else {
            setCountries(prev => [payload, ...prev.filter(c => c.id !== newId)]);
        }

        try {
            if (editingCountry) {
                await referenceApi.updateCountry(editingCountry.id, payload);
            } else {
                await referenceApi.createCountry(payload);
            }
            setShowModal(false);
            loadCountries();
        } catch (err: any) {
            console.error("Failed to save country:", err);
            loadCountries();
            setFormError(err?.message || "Failed to save country.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (c: CountryItem) => {
        const updatedStatus = !(c.isActive ?? true);
        // Optimistic update
        setCountries(prev => prev.map(item => item.id === c.id ? { ...item, isActive: updatedStatus } : item));
        try {
            await referenceApi.updateCountry(c.id, { isActive: updatedStatus });
        } catch {
            loadCountries();
        }
    };

    const handleTogglePopular = async (c: CountryItem) => {
        const updatedPopular = !(c.popularForStudy ?? true);
        // Optimistic update
        setCountries(prev => prev.map(item => item.id === c.id ? { ...item, popularForStudy: updatedPopular } : item));
        try {
            await referenceApi.updateCountry(c.id, { popularForStudy: updatedPopular });
        } catch {
            loadCountries();
        }
    };

    const handleDelete = async (id: string, countryName: string) => {
        if (!confirm(`Are you sure you want to remove ${countryName} from education loan countries?`)) return;
        setCountries(prev => prev.filter(c => c.id !== id));
        try {
            await referenceApi.deleteCountry(id);
        } catch {
            loadCountries();
        }
    };

    // Auto update flag when code changes
    const handleCodeChange = (val: string) => {
        const upper = val.toUpperCase();
        setCode(upper);
        if (PRESET_FLAGS[upper]) {
            setFlag(PRESET_FLAGS[upper]);
        }
    };

    const filtered = countries.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.code?.toLowerCase().includes(search.toLowerCase()) ||
            c.region?.toLowerCase().includes(search.toLowerCase());
        const matchesRegion = regionFilter === "all" || c.region === regionFilter;
        const matchesStatus = statusFilter === "all" ? true :
            statusFilter === "active" ? c.isActive !== false :
            statusFilter === "popular" ? c.popularForStudy :
            statusFilter === "inactive" ? c.isActive === false : true;
        return matchesSearch && matchesRegion && matchesStatus;
    });

    const activeCount = countries.filter(c => c.isActive !== false).length;
    const popularCount = countries.filter(c => c.popularForStudy).length;

    return (
        <div className="space-y-6 font-sans">
            {/* Header & Stats Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                            <span className="material-symbols-outlined text-sm">public</span>
                            Global Education Loan Destinations
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">Study Countries Management</h2>
                        <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
                            Manage official study destinations where VidyaLoans provides education financing. Added countries appear as primary choices in the student loan application form.
                        </p>
                    </div>

                    <button
                        onClick={openAddModal}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2 cursor-pointer shrink-0 border-0"
                    >
                        <span className="material-symbols-outlined text-lg">add_circle</span>
                        Add New Country
                    </button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Countries</span>
                    <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1">{countries.length}</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Active in Apply Form</span>
                    <p className="text-2xl md:text-3xl font-black text-emerald-600 mt-1">{activeCount}</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">Popular Destinations</span>
                    <p className="text-2xl md:text-3xl font-black text-indigo-600 mt-1">{popularCount}</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 block">Regions Covered</span>
                    <p className="text-2xl md:text-3xl font-black text-purple-600 mt-1">
                        {new Set(countries.map(c => c.region).filter(Boolean)).size}
                    </p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by country name, code, region..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active (Visible)</option>
                        <option value="popular">Popular Only</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    {/* Region Filter */}
                    <select
                        value={regionFilter}
                        onChange={e => setRegionFilter(e.target.value)}
                        className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="all">All Regions</option>
                        {REGIONS.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>

                    <button
                        onClick={openAddModal}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 border-0"
                    >
                        <span className="material-symbols-outlined text-base">add_circle</span>
                        + Add Country
                    </button>
                </div>
            </div>

            {/* Country List Cards */}
            {loading ? (
                <div className="py-20 text-center text-xs font-bold text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Loading education loan study countries...
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                    <span className="material-symbols-outlined text-4xl text-slate-300">public_off</span>
                    <p className="text-sm font-bold text-slate-700">No countries match your search filters.</p>
                    <button
                        onClick={openAddModal}
                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl border-0 cursor-pointer shadow-sm"
                    >
                        + Add Country
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(c => (
                        <div
                            key={c.id}
                            className={`p-5 rounded-2xl border transition-all space-y-4 bg-white relative group shadow-xs ${
                                c.isActive === false ? "opacity-60 border-slate-200 bg-slate-50/50" : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl select-none">{c.flag || PRESET_FLAGS[c.code?.toUpperCase()] || "🌐"}</span>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 leading-tight">{c.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                                {c.code}
                                            </span>
                                            {c.region && (
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                                    {c.region}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEditModal(c)}
                                        className="w-7 h-7 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all border-0 bg-transparent cursor-pointer"
                                        title="Edit Country"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c.id, c.name)}
                                        className="w-7 h-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-all border-0 bg-transparent cursor-pointer"
                                        title="Delete Country"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                                {/* Popular Destination Toggle */}
                                <button
                                    onClick={() => handleTogglePopular(c)}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                                        c.popularForStudy
                                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                            : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[14px]">
                                        {c.popularForStudy ? "star" : "star_outline"}
                                    </span>
                                    {c.popularForStudy ? "Popular" : "Standard"}
                                </button>

                                {/* Active in Apply Form Toggle */}
                                <button
                                    onClick={() => handleToggleActive(c)}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                                        c.isActive !== false
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[14px]">
                                        {c.isActive !== false ? "check_circle" : "cancel"}
                                    </span>
                                    {c.isActive !== false ? "Active in Form" : "Disabled"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ADD / EDIT COUNTRY MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden relative font-sans">
                        {/* Modal Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-extrabold tracking-tight">
                                    {editingCountry ? "Edit Study Destination" : "Add Education Loan Country"}
                                </h3>
                                <p className="text-xs text-slate-300 mt-0.5">Configured countries appear in student application forms</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border-0 cursor-pointer transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">error</span>
                                    {formError}
                                </div>
                            )}

                            {/* Quick Add Presets */}
                            {!editingCountry && (
                                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                        ⚡ Quick Preset Add
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { name: "France", code: "FR", flag: "🇫🇷", region: "Europe" },
                                            { name: "Singapore", code: "SG", flag: "🇸🇬", region: "Asia" },
                                            { name: "Japan", code: "JP", flag: "🇯🇵", region: "Asia" },
                                            { name: "UAE", code: "AE", flag: "🇦🇪", region: "Middle East" },
                                            { name: "Italy", code: "IT", flag: "🇮🇹", region: "Europe" },
                                            { name: "Spain", code: "ES", flag: "🇪🇸", region: "Europe" },
                                            { name: "Netherlands", code: "NL", flag: "🇳🇱", region: "Europe" },
                                            { name: "South Korea", code: "KR", flag: "🇰🇷", region: "Asia" },
                                        ].map(preset => (
                                            <button
                                                type="button"
                                                key={preset.code}
                                                onClick={() => {
                                                    setName(preset.name);
                                                    setCode(preset.code);
                                                    setFlag(preset.flag);
                                                    setRegion(preset.region);
                                                }}
                                                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-600 transition-all cursor-pointer flex items-center gap-1"
                                            >
                                                <span>{preset.flag}</span>
                                                <span>{preset.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Country Name */}
                            <div className="space-y-1">
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                                    Country Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. France, Singapore, Japan, Italy"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                />
                            </div>

                            {/* Country Code & Flag */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                                        Country Code (2 Letters)
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={3}
                                        value={code}
                                        onChange={e => handleCodeChange(e.target.value)}
                                        placeholder="e.g. FR, SG, JP"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 uppercase focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                                        Flag Emoji / Symbol
                                    </label>
                                    <input
                                        type="text"
                                        value={flag}
                                        onChange={e => setFlag(e.target.value)}
                                        placeholder="e.g. 🇫🇷, 🇸🇬, 🌐"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-center text-lg"
                                    />
                                </div>
                            </div>

                            {/* Region */}
                            <div className="space-y-1">
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                                    Geographic Region
                                </label>
                                <select
                                    value={region}
                                    onChange={e => setRegion(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                >
                                    {REGIONS.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Options Checkboxes */}
                            <div className="pt-2 space-y-3 border-t border-slate-100">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={popularForStudy}
                                        onChange={e => setPopularForStudy(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs font-bold text-slate-700">Mark as Popular Study Destination</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={e => setIsActive(e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                    />
                                    <span className="text-xs font-bold text-slate-700">Enable in Student Apply Loan Form</span>
                                </label>
                            </div>

                            {/* Modal Actions */}
                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border-0 cursor-pointer transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl uppercase tracking-wider border-0 cursor-pointer shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        editingCountry ? "Update Country" : "Add Country"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

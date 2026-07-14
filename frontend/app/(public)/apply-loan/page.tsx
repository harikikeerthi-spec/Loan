"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { applicationApi, authApi, aiApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/DatePicker";
import { getAllCountries } from "@/lib/countriesData";

const banks = [
    { id: "idfc", name: "IDFC First Bank", rate: "10.5 - 12.5%" },
    { id: "hdfc", name: "HDFC Credila", rate: "10.75 - 12.5%" },
    { id: "auxilo", name: "Auxilo Finserve", rate: "11.25 - 13.5%" },
    { id: "avanse", name: "Avanse Financial", rate: "10.99 - 13.0%" },
    { id: "poonawalla", name: "Poonawalla Fincorp", rate: "11.5 - 14.5%" },
];

const loanTypes = ["Undergraduate Abroad", "Postgraduate Abroad", "Doctoral/PhD Abroad", "Professional Course"];
const courses = ["B.Tech/B.E.", "MBA/PGDM", "MS/M.Tech", "MBBS/Medicine", "Law", "Architecture", "Arts & Humanities", "Other"];
const popularCountries = ["USA", "UK", "Canada", "Australia", "Germany", "Ireland", "New Zealand", "Other"];
const allCountries = getAllCountries();

const formatIndianCurrency = (val: string): string => {
    const clean = val.replace(/\D/g, "");
    if (!clean) return "";
    const num = parseInt(clean, 10);
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("en-IN").format(num);
};

const convertNumberToWords = (numStr: string): string => {
    const clean = numStr.replace(/\D/g, "");
    if (!clean) return "";
    const num = parseInt(clean, 10);
    if (isNaN(num) || num === 0) return "";

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convertLessThanThousand = (n: number): string => {
        if (n < 20) return ones[n];
        const hundred = Math.floor(n / 100);
        const rem = n % 100;
        let s = "";
        if (hundred > 0) {
            s += ones[hundred] + " Hundred";
            if (rem > 0) s += " ";
        }
        if (rem < 20) {
            s += ones[rem];
        } else {
            s += tens[Math.floor(rem / 10)];
            if (rem % 10 > 0) s += " " + ones[rem % 10];
        }
        return s;
    };

    let result = "";
    let temp = num;

    if (Math.floor(temp / 10000000) > 0) {
        result += convertLessThanThousand(Math.floor(temp / 10000000)) + " Crore" + (Math.floor(temp / 10000000) > 1 ? "s" : "") + " ";
        temp %= 10000000;
    }
    if (Math.floor(temp / 100000) > 0) {
        result += convertLessThanThousand(Math.floor(temp / 100000)) + " Lakh" + (Math.floor(temp / 100000) > 1 ? "s" : "") + " ";
        temp %= 100000;
    }
    if (Math.floor(temp / 1000) > 0) {
        result += convertLessThanThousand(Math.floor(temp / 1000)) + " Thousand ";
        temp %= 1000;
    }
    if (temp > 0) {
        result += convertLessThanThousand(temp);
    }
    return result.trim();
};

export default function ApplyLoanPage() {
    const { isAuthenticated, user, refreshUser } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        bank: "",
        loanType: "",
        amount: "40,00,000",
        courseType: "",
        country: "",
        otherCountry: "",
        university: "",
        annualFee: "",
        livingCost: "",
        coApplicant: "",
        otherRelation: "",
        income: "",
        collateral: "no",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        address: "",
        pincode: "",
        notes: "",
        admissionStatus: "waiting", // confirmed, conditional, waiting
        intakeSeason: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [validatingUniversity, setValidatingUniversity] = useState(false);
    const [suggestedUniversities, setSuggestedUniversities] = useState<any[]>([]);
    const [loadingUniversities, setLoadingUniversities] = useState(false);
    const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false);

    // Pre-fill personal info from user profile and URL params
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const uni = params.get("university");
            const country = params.get("country");
            const bankParam = params.get("bank");
            const amountParam = params.get("amount");

            let selectedBank = "";
            if (bankParam) {
                const normBank = bankParam.toLowerCase().trim();
                if (normBank === "credila" || normBank === "hdfc") {
                    selectedBank = "hdfc";
                } else if (normBank === "idfc") {
                    selectedBank = "idfc";
                } else if (normBank === "auxilo") {
                    selectedBank = "auxilo";
                } else if (normBank === "avanse") {
                    selectedBank = "avanse";
                } else if (normBank === "poonawalla") {
                    selectedBank = "poonawalla";
                }
            }

            // Look for saved application data in sessionStorage
            const savedData = sessionStorage.getItem("pending_loan_application");
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    if (parsed.formData) setFormData(prev => ({ ...prev, ...parsed.formData }));
                    if (parsed.step) setStep(parsed.step);
                    // Don't remove it yet, only remove after successful submission
                } catch (e) {
                    console.error("Failed to parse saved application data:", e);
                }
            }

            if (uni || country || selectedBank || amountParam || (user && !profileLoaded)) {
                const queryOrUserCountry = country || user?.studyDestination || "";
                const isPredefined = ["USA", "UK", "Canada", "Australia", "Germany", "Ireland", "New Zealand"].includes(queryOrUserCountry);

                setFormData((prev) => {
                    const finalCountry = prev.country || (queryOrUserCountry ? (isPredefined ? queryOrUserCountry : "Other") : "");
                    const finalOtherCountry = prev.otherCountry || (queryOrUserCountry && !isPredefined ? queryOrUserCountry : "");
                    return {
                        ...prev,
                        university: prev.university || uni || "",
                        country: finalCountry,
                        otherCountry: finalOtherCountry,
                        bank: selectedBank || prev.bank || "",
                        amount: prev.amount || (amountParam ? formatIndianCurrency(amountParam) : "40,00,000"),
                        firstName: prev.firstName || user?.firstName || "",
                        lastName: prev.lastName || user?.lastName || "",
                        email: prev.email || user?.email || "",
                        phone: prev.phone || user?.phoneNumber || user?.mobile || "",
                        // Support both DD-MM-YYYY (from DatePicker / backend) and fallback fields
                        dateOfBirth: prev.dateOfBirth || user?.dateOfBirth || "",
                        intakeSeason: prev.intakeSeason || user?.intakeSeason || "",
                        pincode: prev.pincode || user?.pincode || "",
                    };
                });
                // Only mark profile as loaded once we have the DOB from the user object.
                // This ensures that if refreshUser() resolves after the first render, the
                // DOB (and other async-loaded fields) still get pre-filled correctly.
                if (user && user.dateOfBirth) setProfileLoaded(true);
                else if (user && !user.dateOfBirth) {
                    // User loaded but DOB not yet available — keep profileLoaded false
                    // so we retry when user object updates with DOB from refreshUser()
                }
            }
        }
    }, [user, profileLoaded]);

    const update = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error for that field when user types
        if (stepErrors[field]) {
            setStepErrors((prev) => {
                const copy = { ...prev };
                delete copy[field];
                return copy;
            });
        }
    };

    // Fetch popular universities for the selected country using AI
    useEffect(() => {
        const selectedCountry = formData.country === "Other" ? formData.otherCountry : formData.country;
        if (!selectedCountry || selectedCountry.trim().length < 2) {
            setSuggestedUniversities([]);
            return;
        }

        const fetchUnis = async () => {
            setLoadingUniversities(true);
            try {
                const res = await aiApi.aiSearch({
                    type: "university",
                    query: "",
                    country: selectedCountry
                }) as any;

                if (res && res.success && res.universities) {
                    setSuggestedUniversities(res.universities);
                } else {
                    setSuggestedUniversities([]);
                }
            } catch (err) {
                console.error("Failed to fetch universities via AI", err);
                setSuggestedUniversities([]);
            } finally {
                setLoadingUniversities(false);
            }
        };

        fetchUnis();
    }, [formData.country, formData.otherCountry]);

    // Search universities when typing in the input field
    useEffect(() => {
        const selectedCountry = formData.country === "Other" ? formData.otherCountry : formData.country;
        if (!selectedCountry || !formData.university || formData.university.trim().length < 2) {
            return;
        }

        // Avoid querying if the input matches one of the already suggested universities exactly
        const matched = suggestedUniversities.some(u => u.name.toLowerCase() === formData.university.toLowerCase());
        if (matched) return;

        const delayDebounceFn = setTimeout(async () => {
            setLoadingUniversities(true);
            try {
                const res = await aiApi.aiSearch({
                    type: "university",
                    query: formData.university,
                    country: selectedCountry
                }) as any;

                if (res && res.success && res.universities) {
                    setSuggestedUniversities(res.universities);
                }
            } catch (err) {
                console.error("Failed to query universities via AI", err);
            } finally {
                setLoadingUniversities(false);
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [formData.university, formData.country, formData.otherCountry]);

    const amountLakhs = (() => {
        if (!formData.amount) return 40;
        const cleanNum = Number(formData.amount.replace(/[^0-9]/g, ""));
        return Math.round(cleanNum / 100000);
    })();

    const formatAmountDisplay = (amountStr: string) => {
        if (!amountStr) return "₹0";
        const clean = amountStr.replace(/,/g, "");
        const cleanNum = Number(clean);
        if (isNaN(cleanNum) || cleanNum === 0) return "₹0";

        return `₹${cleanNum.toLocaleString("en-IN")}`;
    };

    const handleSliderChange = (lakhs: number) => {
        const rupees = lakhs * 100000;
        const formatted = formatIndianCurrency(rupees.toString());
        update("amount", formatted);
    };

    const validateStep1 = async (): Promise<boolean> => {
        const errors: Record<string, string> = {};
        if (!formData.loanType) errors.loanType = "Please select a loan type";
        if (!formData.country) {
            errors.country = "Please select a country";
        } else if (formData.country === "Other" && (!formData.otherCountry || !formData.otherCountry.trim())) {
            errors.otherCountry = "Please specify the destination country";
        }
        if (!formData.university.trim()) {
            errors.university = "Please enter your university";
        } else if (/\d/.test(formData.university)) {
            errors.university = "University name cannot contain numbers";
        }
        const cleanAmount = formData.amount.replace(/,/g, "");
        if (!cleanAmount || Number(cleanAmount) <= 0) {
            errors.amount = "Please enter a valid loan amount";
        } else if (Number(cleanAmount) > 15000000) {
            errors.amount = "Maximum loan amount cannot exceed ₹1,50,00,000 (1.5 Crore)";
        }

        if (Object.keys(errors).length === 0) {
            const selectedCountry = formData.country === "Other" ? formData.otherCountry : formData.country;
            setValidatingUniversity(true);
            try {
                const res = await aiApi.validateUniversityCountry(formData.university, selectedCountry) as any;
                if (res && res.success && !res.valid) {
                    let errMsg = `This university does not seem to be located in ${selectedCountry}.`;
                    if (res.correctedCountry) {
                        errMsg += ` It appears to be in ${res.correctedCountry}.`;
                    }
                    errors.university = errMsg;
                }
            } catch (err) {
                console.error("AI university verification failed", err);
            } finally {
                setValidatingUniversity(false);
            }
        }

        setStepErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resolvePincode = async (pin: string) => {
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
            const data = await res.json();
            if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice[0]) {
                const po = data[0].PostOffice[0];
                const city = po.District || po.Taluk || po.Name;
                const state = po.State;
                if (city && state) {
                    setFormData(prev => {
                        const currentAddr = prev.address.trim();
                        if (currentAddr) {
                            if (currentAddr.includes(city) || currentAddr.includes(state)) {
                                return prev;
                            }
                            return { ...prev, address: `${currentAddr}, ${city}, ${state}` };
                        }
                        return { ...prev, address: `${city}, ${state}` };
                    });
                }
            }
        } catch (e) {
            console.error("Failed to resolve pincode details:", e);
        }
    };

    const validateStep2 = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.firstName.trim()) errors.firstName = "First name is required";
        if (!formData.lastName.trim()) errors.lastName = "Last name is required";
        if (!formData.email.trim()) errors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Please enter a valid email";
        if (!formData.phone.trim()) errors.phone = "Phone number is required";
        else if (!/^[\d+\-\s()]{7,15}$/.test(formData.phone.trim())) errors.phone = "Please enter a valid phone number";

        // Age validation: applicant must be 18–40 years old
        if (!formData.dateOfBirth) {
            errors.dateOfBirth = "Date of birth is required";
        } else {
            const [dd, mm, yyyy] = formData.dateOfBirth.split("-").map(Number);
            const dob = new Date(yyyy, mm - 1, dd);
            const today = new Date();
            const ageMs = today.getTime() - dob.getTime();
            const age = new Date(ageMs).getUTCFullYear() - 1970;
            if (age < 18) errors.dateOfBirth = "You must be at least 18 years old to apply";
            else if (age > 40) errors.dateOfBirth = "Applicants above 40 years are not eligible for this loan";
        }

        if (!formData.pincode.trim()) {
            errors.pincode = "Pincode is required";
        } else if (formData.pincode.length !== 6) {
            errors.pincode = "Pincode must be exactly 6 digits";
        }

        if (!formData.address.trim()) {
            errors.address = "Residential address is required";
        }

        if (!formData.coApplicant) errors.coApplicant = "Please select co-applicant type";
        if (formData.coApplicant === "other" && !formData.otherRelation) {
            errors.otherRelation = "Please select other relation type";
        }
        const cleanIncome = formData.income.replace(/,/g, "");
        if (formData.coApplicant && (!cleanIncome || Number(cleanIncome) <= 0)) {
            errors.income = "Please enter co-applicant annual income";
        }
        setStepErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const next = async () => {
        if (step === 1) {
            const isValid = await validateStep1();
            if (!isValid) return;
        }
        if (step === 2 && !validateStep2()) return;
        setStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const back = () => {
        setStep((s) => s - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async () => {
        if (!isAuthenticated || !user?.id) {
            // Save form data and current step to session storage before redirecting
            sessionStorage.setItem("pending_loan_application", JSON.stringify({ formData, step }));
            router.push(`/login?redirect=/apply-loan`);
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const userId = user.id;
            const bankName = banks.find(b => b.id === formData.bank)?.name || formData.bank || "Any Bank";
            const cleanAmount = formData.amount.replace(/,/g, "");
            const cleanAnnualFee = formData.annualFee ? formData.annualFee.replace(/,/g, "") : "";
            const cleanLivingCost = formData.livingCost ? formData.livingCost.replace(/,/g, "") : "";
            const cleanIncome = formData.income ? formData.income.replace(/,/g, "") : "";

            const parsedAnnualFee = cleanAnnualFee ? parseFloat(cleanAnnualFee) : undefined;
            const parsedLivingCost = cleanLivingCost ? parseFloat(cleanLivingCost) : undefined;
            const parsedIncome = cleanIncome ? parseFloat(cleanIncome) : undefined;

            const rel = formData.coApplicant === "other" ? formData.otherRelation : formData.coApplicant;
            const capitalizedRelation = rel ? rel.charAt(0).toUpperCase() + rel.slice(1) : "";

            await applicationApi.create({
                ...formData,
                hasCoApplicant: !!formData.coApplicant && formData.coApplicant !== "none",
                coApplicantName: capitalizedRelation || null,
                coApplicantRelation: rel || null,
                coApplicantIncome: isNaN(parsedIncome as number) ? undefined : parsedIncome,
                coApplicant: rel || null,
                country: formData.country === "Other" ? formData.otherCountry : formData.country,
                userId,
                bank: bankName,
                amount: parseFloat(cleanAmount),
                annualFee: isNaN(parsedAnnualFee as number) ? undefined : parsedAnnualFee,
                livingCost: isNaN(parsedLivingCost as number) ? undefined : parsedLivingCost,
                income: isNaN(parsedIncome as number) ? undefined : parsedIncome,
            });

            // Sync personal details to main user profile if authenticated
            if (user?.email) {
                try {
                    await authApi.updateDetails(user.email, {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phoneNumber: formData.phone,
                        dateOfBirth: formData.dateOfBirth, // Custom DatePicker already returns DD-MM-YYYY
                        intakeSeason: formData.intakeSeason,
                        pincode: formData.pincode,
                    });
                    await refreshUser();
                } catch (err) {
                    console.error("Failed to sync profile details:", err);
                }
            }
            // Notify other parts of the frontend that dashboard data changed
            try {
                const key = `dashboardDataUpdated_${userId}`;
                localStorage.setItem(key, String(Date.now()));
                // Dispatch an in-page event so same-tab listeners react immediately
                window.dispatchEvent(new Event('dashboard-data-changed'));
            } catch (err) {
                // ignore
            }

            // Clear saved data on success
            sessionStorage.removeItem("pending_loan_application");
            setSubmitted(true);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to submit");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
                {/* Bright Success Decorations matching Homepage aesthetic */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-white/20 z-0" />
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[#3A2EAB]/10 blur-[150px] rounded-full z-0" />
                <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-[#9B51E0]/5 blur-[150px] rounded-full z-0" />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #3A2EAB 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 max-w-xl w-full text-center animate-fade-in-up">
                    <div className="mb-10 relative inline-block">
                        <div className="w-28 h-28 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative z-10 animate-bounce-slow border border-emerald-400">
                            <span className="material-symbols-outlined text-white text-6xl">verified</span>
                        </div>
                        <div className="absolute inset-0 bg-emerald-400 rounded-[2rem] blur-2xl opacity-30 animate-pulse" />
                    </div>

                    <h2 className="text-4xl font-black text-gray-900 mb-6 tracking-tight" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>Application Transmitted!</h2>
                    <p className="text-gray-600 font-medium text-lg mb-4 leading-relaxed">
                        Your financing request for <span className="text-[#3A2EAB] font-black">{formData.university}</span> has been successfully logged.
                    </p>
                    <p className="text-gray-500 text-sm font-medium mb-12">
                        Our credit specialists are currently reviewing your eligibility. Expect a status update within <span className="text-gray-900 font-bold">24-48 hours</span>.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 group">
                        <Link href="/dashboard#applications" className="px-8 py-5 bg-gradient-to-r from-[#9B51E0] to-[#E040FB] text-white text-[11px] uppercase tracking-[0.2em] font-black rounded-2xl hover:brightness-110 hover:shadow-2xl hover:shadow-[#9B51E0]/30 transition-all flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-lg">dashboard_customize</span>
                            Dashboard
                        </Link>
                        <Link href="/" className="px-8 py-5 bg-white text-gray-900 text-[11px] uppercase tracking-[0.2em] font-black rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-lg">home</span>
                            Return Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-gray-900 overflow-hidden relative" style={{ backgroundColor: '#F8FAFC' }}>
            {/* Bright Aesthetic Background Decorations mimicking the Homepage */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 z-0" style={{ background: 'radial-gradient(circle, #3A2EAB/10, transparent)' }} />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 z-0" style={{ background: 'radial-gradient(circle, #9B51E0/10, transparent)' }} />
                <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full blur-[80px] opacity-20 z-0" style={{ background: 'radial-gradient(circle, #3A2EAB/5, transparent)' }} />
                <div className="absolute inset-0 opacity-[0.02] z-0" style={{ backgroundImage: 'radial-gradient(circle, #3A2EAB 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            </div>

            <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full border border-indigo-100/40 pointer-events-none z-0" />
            <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full border border-indigo-50/30 pointer-events-none z-0" />

            <div className="relative z-10 pt-32 pb-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-12 animate-fade-in-up">

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight font-display">
                            {formData.university ? (
                                <span>Apply for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3A2EAB] to-[#9B51E0]">{formData.university}</span></span>
                            ) : "Apply for Education Loan"}
                        </h1>

                    </div>

                    {formData.university && (
                        <div className="mb-8 bg-[#3A2EAB]/5 border border-[#3A2EAB]/10 text-[#3A2EAB] py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-sm font-extrabold shadow-sm animate-fade-in-up select-none">
                            <span className="text-lg">🎓</span>
                            <span>Financing your dream at <span className="underline decoration-[#9B51E0] decoration-2 underline-offset-4 font-black">{formData.university}</span>, {formData.country === "Other" ? formData.otherCountry : formData.country}</span>
                        </div>
                    )}

                    {/* Enhanced Progress Tracker */}
                    <div className="relative mb-16 max-w-2xl mx-auto">
                        <div className="absolute top-5 left-0 w-full h-[2px] bg-indigo-100/70 transition-all">
                            <div
                                className="h-full bg-gradient-to-r from-[#3A2EAB] to-[#9B51E0] transition-all duration-700 ease-out shadow-[0_0_10px_#3A2EAB]"
                                style={{ width: `${(step / 3) * 100}%` }}
                            />
                        </div>
                        <div className="relative flex justify-between">
                            {["Program Info", "Personal Identity", "Review"].map((s, i) => {
                                const isCompleted = step > i + 1;
                                const isActive = step === i + 1;
                                return (
                                    <div key={s} className="flex flex-col items-center gap-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[13px] font-black transition-all duration-500 shadow-sm ${isCompleted ? "bg-emerald-50 text-emerald-600 rotate-[360deg] border border-emerald-200" : isActive ? "bg-[#3A2EAB] text-white shadow-indigo-500/40 scale-110 border border-[#3A2EAB]" : "bg-white text-gray-400 border border-gray-200"
                                            }`}>
                                            {isCompleted ? <span className="material-symbols-outlined text-lg">check</span> : i + 1}
                                        </div>
                                        <div className={`text-[10px] uppercase tracking-[0.15em] font-black transition-colors ${isActive ? "text-[#3A2EAB]" : isCompleted ? "text-emerald-600" : "text-gray-400"}`}>{s}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-[#F8FAFC]/50 backdrop-blur-2xl rounded-[3rem] p-8 md:p-14 shadow-xl border border-white relative overflow-hidden">
                        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#3A2EAB]/5 rounded-full blur-3xl opacity-50" />

                        {/* Step 1: Loan Details */}
                        {step === 1 && (
                            <div className="space-y-10 animate-fade-in-up relative z-10">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-[#6605c7]">
                                        <span className="material-symbols-outlined text-2xl">account_balance</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>Academic & Financial Details</h2>
                                        <p className="text-gray-500 text-sm font-medium">Specify your academic target and preferred lender</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <SelectField label="Field of Study" icon="category" value={formData.loanType} onChange={(v) => update("loanType", v)}
                                        options={loanTypes.map((t) => ({ value: t, label: t }))} error={stepErrors.loanType} />
                                    <SelectField label="Destination Country" icon="public" value={formData.country} onChange={(v) => {
                                        update("country", v);
                                        if (v !== "Other") {
                                            update("otherCountry", "");
                                        }
                                    }}
                                        options={popularCountries.map((c) => ({ value: c, label: c }))} error={stepErrors.country} />
                                    {formData.country === "Other" && (
                                        <div className="md:col-span-2">
                                            <SearchableSelectField label="Specify Destination Country" icon="public" value={formData.otherCountry} onChange={(v) => update("otherCountry", v)}
                                                options={allCountries.map((c) => ({ value: c, label: c }))} error={stepErrors.otherCountry} placeholder="Search countries..." />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    <div className="relative" onFocus={() => setShowUniversitySuggestions(true)} onBlur={() => {
                                        // Delay hiding suggestions so that click events on the suggestion items can register
                                        setTimeout(() => setShowUniversitySuggestions(false), 200);
                                    }}>
                                        <InputField
                                            label="Full University Name"
                                            icon="domain"
                                            value={formData.university}
                                            onChange={(v) => update("university", v.replace(/\d/g, ""))}
                                            placeholder="e.g. University of Toronto"
                                            error={stepErrors.university}
                                        />

                                        {/* Loading Indicator */}
                                        {loadingUniversities && (
                                            <div className="absolute right-4 top-[50px] flex items-center gap-1.5 text-xs text-[#6605c7] font-bold select-none">
                                                <div className="w-3.5 h-3.5 border-2 border-[#6605c7] border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}

                                        {/* Suggestions Dropdown */}
                                        {showUniversitySuggestions && suggestedUniversities.length > 0 && (
                                            <div className="absolute z-40 left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-purple-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-150/10 animate-fade-in">
                                                {suggestedUniversities.map((uni) => (
                                                    <button
                                                        key={uni.name}
                                                        type="button"
                                                        onClick={() => {
                                                            update("university", uni.name);
                                                            setShowUniversitySuggestions(false);
                                                        }}
                                                        className="w-full px-5 py-3.5 text-left text-xs font-bold text-gray-700 hover:text-[#6605c7] hover:bg-purple-50/50 transition-all flex items-center justify-between"
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[13px] font-black text-gray-900 group-hover:text-[#6605c7]">{uni.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium">{uni.loc || uni.country || "Popular University"}</span>
                                                        </div>
                                                        <span className="material-symbols-outlined text-[#6605c7] text-sm opacity-0 hover:opacity-100 transition-opacity">chevron_right</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Loan Amount Slider (0 - 1.5 Cr) */}
                                    <div className="bg-white/50 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-5">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                            <label className="text-[11px] uppercase tracking-[0.2em] font-black text-gray-500 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg text-[#6605c7]">payments</span>
                                                Requested Loan Amount
                                            </label>
                                            <span className="text-base font-black text-[#6605c7] bg-purple-50 border border-purple-100 px-4 py-2 rounded-2xl shadow-sm self-start sm:self-auto select-none">
                                                {formatAmountDisplay(formData.amount)}
                                            </span>
                                        </div>

                                        <div className="relative pt-4 pb-2 px-1">
                                            <input
                                                type="range"
                                                min="0"
                                                max="150"
                                                step="5"
                                                value={amountLakhs}
                                                onChange={(e) => handleSliderChange(Number(e.target.value))}
                                                className="w-full h-2.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-[#6605c7] focus:outline-none transition-all duration-300"
                                            />
                                            <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-wider mt-4 px-1 select-none">
                                                <span>0</span>
                                                <span>20L</span>
                                                <span>40L</span>
                                                <span>60L</span>
                                                <span>80L</span>
                                                <span>1Cr</span>
                                                <span>1.2Cr</span>
                                                <span>1.4Cr</span>
                                                <span>1.5Cr</span>
                                            </div>
                                        </div>

                                        {stepErrors.amount && (
                                            <p className="text-rose-500 text-xs font-bold mt-1.5 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">warning</span>
                                                {stepErrors.amount}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-8">
                                        <SelectField label="Admission Status" icon="verified" value={formData.admissionStatus} onChange={(v) => update("admissionStatus", v)}
                                            options={[
                                                { value: "confirmed", label: "Confirmed Admission" },
                                                { value: "conditional", label: "Conditional Offer" },
                                                { value: "waiting", label: "Awaiting Result" },
                                                { value: "planning", label: "Planning Stage" }
                                            ]} error={stepErrors.admissionStatus} required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Personal Info */}
                        {step === 2 && (
                            <div className="space-y-10 animate-fade-in-up relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#3A2EAB]">
                                            <span className="material-symbols-outlined text-2xl">person_pin</span>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>Personal Identity</h2>
                                            <p className="text-gray-500 text-sm font-medium">Help us verify your profile for instant approval</p>
                                        </div>
                                    </div>
                                    {user?.firstName && (
                                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                                            <span className="material-symbols-outlined text-[14px]">verified_user</span>
                                            Verified Profile
                                        </div>
                                    )}
                                </div>

                                {/* Card 1: Primary Applicant Details */}
                                <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-[0_4px_25_rgba(0,0,0,0.02)] space-y-6">
                                    <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100/70">
                                        <span className="material-symbols-outlined text-xl text-[#3A2EAB]">person</span>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-800">Primary Applicant Details</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <InputField label="Given Name" icon="person" value={formData.firstName} onChange={(v) => update("firstName", v.replace(/[^A-Za-z]/g, "").slice(0, 30))} placeholder="Rahul" error={stepErrors.firstName} required />
                                        <InputField label="Surname" icon="person" value={formData.lastName} onChange={(v) => update("lastName", v.replace(/[^A-Za-z]/g, "").slice(0, 30))} placeholder="Sharma" error={stepErrors.lastName} required />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <InputField label="Email Address" icon="mail" value={formData.email} onChange={(v) => update("email", v)} placeholder="rahul@example.com" type="email" error={stepErrors.email} required />
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 flex items-center justify-between">
                                                <span>Mobile Number <span className="text-red-500 ml-1">*</span></span>
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-400 group-focus-within:text-[#3A2EAB] transition-all select-none">
                                                    <span className="text-lg">🇮🇳</span>
                                                    <span className="text-xs font-bold text-gray-500">+91</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={formData.phone.startsWith("+91 ") ? formData.phone.replace("+91 ", "") : formData.phone.replace(/^\+91/, "")}
                                                    onChange={(e) => {
                                                        const cleanNum = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                        update("phone", cleanNum ? `+91 ${cleanNum}` : "");
                                                    }}
                                                    placeholder="98237 49821"
                                                    className={`w-full pl-20 pr-6 py-4 bg-white/70 border rounded-2xl shadow-sm transition-all outline-none text-sm font-bold text-gray-900 focus:bg-white placeholder:text-gray-400 ${stepErrors.phone ? "border-red-300 ring-2 ring-red-100" : "border-gray-200 focus:border-[#3A2EAB]/50 focus:ring-4 focus:ring-[#3A2EAB]/10 hover:border-gray-300"}`}
                                                />
                                            </div>
                                            {stepErrors.phone && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider pl-1">{stepErrors.phone}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <DatePicker
                                            label="Date of Birth"
                                            value={formData.dateOfBirth}
                                            onChange={(v) => update("dateOfBirth", v)}
                                            error={stepErrors.dateOfBirth}
                                            required
                                        />
                                        <InputField
                                            label="Residential Pincode"
                                            icon="pin_drop"
                                            value={formData.pincode}
                                            onChange={(v) => {
                                                const numericVal = v.replace(/\D/g, "").slice(0, 6);
                                                update("pincode", numericVal);
                                                if (numericVal.length === 6) {
                                                    resolvePincode(numericVal);
                                                }
                                            }}
                                            placeholder="e.g. 400001"
                                            error={stepErrors.pincode}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-8">
                                        <InputField label="Residential Address" icon="location_on" value={formData.address} onChange={(v) => update("address", v)} placeholder="e.g. Flat No, Street, Locality, City, State" error={stepErrors.address} required />
                                    </div>
                                </div>

                                {/* Card 2: Co-Applicant & Financials */}
                                <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-[0_4px_25_rgba(0,0,0,0.02)] space-y-6">
                                    <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100/70">
                                        <span className="material-symbols-outlined text-xl text-[#3A2EAB]">group</span>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-800">Co-Applicant & Financials</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <SelectField label="Relationship" icon="family_history" value={formData.coApplicant} onChange={(v) => {
                                            update("coApplicant", v);
                                            if (v !== "other") {
                                                update("otherRelation", "");
                                            }
                                        }}
                                            options={[
                                                { value: "parent", label: "Parent" },
                                                { value: "spouse", label: "Spouse" },
                                                { value: "sibling", label: "Sibling" },
                                                { value: "other", label: "Other" }
                                            ]} error={stepErrors.coApplicant} required />
                                        {formData.coApplicant === "other" && (
                                            <InputField
                                                label="If Other, Specify Relation"
                                                icon="people"
                                                value={formData.otherRelation}
                                                onChange={(v) => update("otherRelation", v)}
                                                placeholder="e.g. Uncle"
                                                error={stepErrors.otherRelation}
                                                required
                                            />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">
                                                Co-Applicant Gross Annual Income <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-sm pointer-events-none">
                                                    ₹
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.income}
                                                    onChange={(e) => update("income", formatIndianCurrency(e.target.value))}
                                                    placeholder="20,00,000"
                                                    className={`w-full pl-8 pr-44 py-4 bg-white border rounded-2xl shadow-sm outline-none text-sm font-bold text-gray-900 focus:bg-white transition-all ${stepErrors.income ? "border-red-300 ring-2 ring-red-100" : "border-gray-200 focus:border-[#3A2EAB]/50 focus:ring-4 focus:ring-[#3A2EAB]/10 hover:border-gray-300"}`}
                                                />
                                                {formData.income && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-[#3A2EAB] bg-[#3A2EAB]/5 px-2.5 py-1 rounded-lg border border-[#3A2EAB]/10 animate-fadeIn pointer-events-none truncate max-w-[170px]">
                                                        ({convertNumberToWords(formData.income)})
                                                    </div>
                                                )}
                                            </div>
                                            {stepErrors.income && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider pl-1">{stepErrors.income}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-12 animate-fade-in-up relative z-10">
                                <div className="flex items-center justify-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                                        <span className="material-symbols-outlined text-2xl">rate_review</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>Validate Your File</h2>
                                        <p className="text-gray-500 text-sm font-medium">Verify all details before submission</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* Loan Details Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-[#6605c7] mb-6 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm">account_balance</span>
                                            </div>
                                            Loan Details
                                        </h3>
                                        <div className="bg-white/70 rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4">
                                            {[
                                                { label: "Loan Structure", value: formData.loanType },
                                                { label: "Required Amount", value: formData.amount ? `₹${Number(formData.amount.replace(/,/g, "")).toLocaleString("en-IN")}` : "" },
                                                { label: "Destination", value: formData.country === "Other" ? formData.otherCountry : formData.country },
                                                { label: "University", value: formData.university },
                                            ].filter((f) => f.value).map((f) => (
                                                <div key={f.label} className="flex justify-between items-center py-3 border-b border-gray-100/50 last:border-0">
                                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{f.label}</span>
                                                    <span className="font-black text-[13px] text-gray-900">{f.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Personal Info Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-indigo-600 mb-6 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm">person_filled</span>
                                            </div>
                                            Applicant Identity
                                        </h3>
                                        <div className="bg-white/70 rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4">
                                            {[
                                                { label: "Legal Name", value: `${formData.firstName} ${formData.lastName}`.trim() },
                                                { label: "Email ID", value: formData.email },
                                                { label: "Mobile Line", value: formData.phone },
                                                {
                                                    label: "Birth Record", value: (() => {
                                                        if (!formData.dateOfBirth) return "";
                                                        // Handle DD-MM-YYYY format (from DatePicker and backend)
                                                        if (/^\d{2}-\d{2}-\d{4}$/.test(formData.dateOfBirth)) {
                                                            const [dd, mm, yyyy] = formData.dateOfBirth.split("-").map(Number);
                                                            const d = new Date(yyyy, mm - 1, dd);
                                                            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                                                        }
                                                        // Fallback: ISO or other formats
                                                        const fallback = new Date(formData.dateOfBirth);
                                                        return isNaN(fallback.getTime()) ? formData.dateOfBirth : fallback.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                                                    })()
                                                },
                                                { label: "Co-Applicant", value: formData.coApplicant === "none" ? "None" : formData.coApplicant ? formData.coApplicant.charAt(0).toUpperCase() + formData.coApplicant.slice(1) : "" },
                                                { label: "Secondary Income", value: formData.income && formData.coApplicant !== "none" ? `₹${Number(formData.income.replace(/,/g, "")).toLocaleString("en-IN")}` : "" },
                                                // { label: "Collateral", value: formData.collateral.split(':')[0] },
                                                { label: "Residential Pincode", value: formData.pincode },
                                            ].filter((f) => f.value).map((f) => (
                                                <div key={f.label} className="flex justify-between items-center py-3 border-b border-gray-100/50 last:border-0">
                                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{f.label}</span>
                                                    <span className="font-black text-[13px] text-gray-900">{f.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>



                                {error && (
                                    <div className="px-6 py-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-[13px] font-bold flex items-center gap-3 animate-bounce">
                                        <span className="material-symbols-outlined text-xl">error</span>
                                        {error}
                                    </div>
                                )}
                                {!isAuthenticated && (
                                    <div className="px-6 py-6 bg-amber-50 border border-amber-200 rounded-3xl text-amber-700 text-sm font-medium flex items-center gap-4 shadow-sm">
                                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shadow-sm border border-amber-200">
                                            <span className="material-symbols-outlined">priority_high</span>
                                        </div>
                                        <div>
                                            Authentication required to finalize submission.
                                            <Link href="/login?redirect=/apply-loan" className="ml-2 underline font-black text-[#6605c7]">Login Now</Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-16 pt-10 border-t border-gray-100/50 relative z-10">
                            {step > 1 ? (
                                <button onClick={back} className="w-full sm:w-auto px-10 py-4 bg-white text-gray-600 border border-gray-200 text-[11px] uppercase tracking-[0.2em] font-black rounded-2xl hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all flex items-center justify-center gap-3 group">
                                    <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                    Previous Stage
                                </button>
                            ) : <div />}

                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                {step < 3 ? (
                                    <button
                                        onClick={next}
                                        disabled={step === 1 && validatingUniversity}
                                        className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-[#9B51E0] to-[#E040FB] text-white text-[11px] uppercase tracking-[0.2em] font-black rounded-2xl hover:brightness-110 hover:shadow-[0_0_20px_rgba(155,81,224,0.4)] transition-all flex items-center justify-center gap-3 group border border-[#e040fb]/30 active:scale-98 disabled:opacity-50 cursor-pointer"
                                    >
                                        {step === 1 && validatingUniversity ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                                Verifying target...
                                            </>
                                        ) : (
                                            <>
                                                {step === 2 ? "Save & Continue" : "Next"}
                                                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="w-full sm:w-auto px-16 py-4 bg-gradient-to-r from-[#9B51E0] to-[#E040FB] text-white text-[11px] uppercase tracking-[0.2em] font-black rounded-2xl hover:brightness-110 hover:shadow-[0_0_30px_rgba(155,81,224,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-4 group relative overflow-hidden active:scale-98 border border-[#e040fb]/30"
                                    >
                                        {submitting ? (
                                            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-lg group-hover:scale-125 transition-transform">rocket_launch</span>
                                                Submit Final Application
                                            </>
                                        )}
                                        <div className="absolute top-0 -left-full w-full h-full bg-white/20 skew-x-[-25deg] group-hover:left-[200%] transition-all duration-[1.5s]" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8 text-[10px] font-black text-gray-500 uppercase tracking-widest relative z-10 select-none">
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-500 text-xs">🔒</span>
                            256-Bit AES Encrypted
                        </div>
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full hidden md:block" />
                        <div className="flex items-center gap-2">
                            <span className="text-[#3A2EAB] text-xs">🏛</span>
                            RBI Licensed Lenders
                        </div>
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full hidden md:block" />
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-500 text-xs">✅</span>
                            VidyaLoan Assurance
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InputField({ label, icon, value, onChange, placeholder, type = "text", error, required }: {
    label: string; icon?: string; value: string; onChange: (v: string) => void;
    placeholder?: string; type?: string; error?: string; required?: boolean;
}) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 flex items-center justify-between">
                <span>{label} {required && <span className="text-red-500 ml-1">*</span>}</span>
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6605c7] transition-all">
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full ${icon ? 'pl-12' : 'px-6'} pr-6 py-4 bg-white/70 border rounded-2xl shadow-sm transition-all outline-none text-sm font-bold text-gray-900 focus:bg-white placeholder:text-gray-400 ${error ? "border-red-300 ring-2 ring-red-100" : "border-gray-200 focus:border-[#6605c7]/50 focus:ring-4 focus:ring-purple-100 hover:border-gray-300"}`}
                />
            </div>
            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider pl-1">{error}</p>}
        </div>
    );
}

function SelectField({ label, icon, value, onChange, options, error, required }: {
    label: string; icon?: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[]; error?: string; required?: boolean;
}) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">
                {label} {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6605c7] pointer-events-none transition-all">
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                    </div>
                )}
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full ${icon ? 'pl-12' : 'px-6'} pr-10 py-4 bg-white/70 border rounded-2xl shadow-sm appearance-none outline-none text-sm font-bold text-gray-900 focus:bg-white transition-all cursor-pointer ${error ? "border-red-300 ring-2 ring-red-100" : "border-gray-200 focus:border-[#6605c7]/50 focus:ring-4 focus:ring-purple-100 hover:border-gray-300"}`}
                >
                    <option value="" disabled className="text-gray-400">Choose Option...</option>
                    {options.map((o) => <option key={o.value} value={o.value} className="bg-white text-gray-900">{o.label}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <span className="material-symbols-outlined text-lg">expand_more</span>
                </div>
            </div>
            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider pl-1">{error}</p>}
        </div>
    );
}

function SearchableSelectField({ label, icon, value, onChange, options, error, required, placeholder = "Search..." }: {
    label: string; icon?: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[]; error?: string; required?: boolean;
    placeholder?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter options based on search query
    const filteredOptions = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    // Selected label
    const selectedOption = options.find(o => o.value === value);
    const selectedLabel = selectedOption ? selectedOption.label : "Choose Option...";

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Reset search when dropdown opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSearch("");
        }
    }, [isOpen]);

    return (
        <div className="space-y-3" ref={dropdownRef}>
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">
                {label} {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
                {/* Trigger Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full text-left ${icon ? 'pl-12' : 'px-6'} pr-10 py-4 bg-white/70 border rounded-2xl shadow-sm outline-none text-sm font-bold text-gray-900 focus:bg-white transition-all cursor-pointer flex items-center justify-between ${error ? "border-red-300 ring-2 ring-red-100" : "border-gray-200 focus:border-[#6605c7]/50 focus:ring-4 focus:ring-purple-100 hover:border-gray-300"}`}
                >
                    <span className="truncate">{selectedLabel}</span>
                    <span className="material-symbols-outlined text-lg text-gray-400">expand_more</span>
                </button>

                {icon && (
                    <div className="absolute left-4 top-[18px] text-gray-400 pointer-events-none transition-all">
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                    </div>
                )}

                {/* Dropdown Card */}
                {isOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-purple-150 rounded-2xl shadow-xl max-h-80 overflow-hidden flex flex-col animate-fade-in">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder={placeholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-transparent border-0 outline-none text-xs font-bold text-gray-800 placeholder:text-gray-400 py-1"
                                autoFocus
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            )}
                        </div>

                        {/* Options List */}
                        <div className="overflow-y-auto max-h-60 divide-y divide-gray-50">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((o) => {
                                    const isSelected = o.value === value;
                                    return (
                                        <button
                                            key={o.value}
                                            type="button"
                                            onClick={() => {
                                                onChange(o.value);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full px-5 py-3 text-left text-xs font-bold text-gray-700 hover:text-[#6605c7] hover:bg-purple-50/50 transition-all flex items-center justify-between ${isSelected ? 'bg-purple-50/70 text-[#6605c7]' : ''}`}
                                        >
                                            <span>{o.label}</span>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-[#6605c7] text-sm">check</span>
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-5 py-4 text-center text-xs text-gray-400 font-medium">
                                    No countries found
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider pl-1">{error}</p>}
        </div>
    );
}

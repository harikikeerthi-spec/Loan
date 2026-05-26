"use client";

import { useState } from "react";

const offices = [
    { city: "Hyderabad", role: "Headquarters & Counselor Center", address: "Block D-3, IT Park, Gachibowli, Hyderabad, Telangana 500032", phone: "+91 9240209000" },
    { city: "Bangalore", role: "Technology Hub & Counselor Center", address: "Level 4, Diamond District, Indiranagar, Bangalore 560008", phone: "+91 9240209001" },
    { city: "Mumbai", role: "Lending Partnerships Office", address: "Executive Suite 12, BKC Fin-Tech Tower, Mumbai 400051", phone: "+91 9240209002" },
    { city: "Delhi", role: "Counselor Center", address: "Building 18, Connaught Place, New Delhi 110001", phone: "+91 9240209003" },
    { city: "Chennai", role: "Regional Support Desk", address: "Phase II, Tech Center, OMR, Chennai 600096", phone: "+91 9240209004" }
];

export default function ContactUsPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "Loan Eligibility",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate high-fidelity backend submit
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setFormData({ name: "", email: "", phone: "", subject: "Loan Eligibility", message: "" });
        }, 1800);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="min-h-screen relative text-gray-900 overflow-hidden" style={{ background: 'linear-gradient(135deg, #ede0ff 0%, #f3eaff 25%, #fdf6ff 55%, #fef3e8 80%, #fde8c8 100%)' }}>
            
            {/* Elegant Background Decorators from Home Page */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-50" style={{ background: 'radial-gradient(circle, #d8b4fe, transparent)' }} />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-40" style={{ background: 'radial-gradient(circle, #fed7aa, transparent)' }} />
                <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full blur-[80px] opacity-20" style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #6605c7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            </div>

            {/* Hero Header */}
            <section className="pt-36 pb-16 px-6 relative z-10 text-center max-w-4xl mx-auto">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#6605c7]/10 border border-[#6605c7]/15 text-[#6605c7] text-[11px] font-bold uppercase tracking-widest mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6605c7] animate-pulse"></span>
                    Get In Touch
                </span>
                <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 tracking-tight leading-tight text-[#1a1626]">
                    Contact Our <span className="text-[#6605c7]">Advisors</span>
                </h1>
                <p className="text-[16px] text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                    Have questions about dynamic matching rates, documentation criteria, or co-applicant profiles? Our financial counselors are always ready to assist.
                </p>
            </section>

            {/* Main Interactive Contact Split Layout */}
            <section className="py-12 pb-24 px-6 relative z-10 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    
                    {/* Left Column: Premium Interactive Contact Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                            {/* Glow accent */}
                            <div className="absolute -left-16 -top-16 w-36 h-36 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                            
                            {isSuccess ? (
                                <div className="text-center py-16 animate-fade-in-up">
                                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-emerald-500/20 transform hover:scale-105 transition-transform">
                                        <span className="material-symbols-outlined text-4xl font-bold">check</span>
                                    </div>
                                    <h3 className="text-2xl font-bold font-display mb-4 text-[#1a1626]">Message Sent Successfully!</h3>
                                    <p className="text-gray-500 text-[13.5px] leading-relaxed max-w-md mx-auto mb-8 font-medium">
                                        Thank you for reaching out. A certified VidyaLoans financial advisor has received your query and will contact you via email or phone within the next 2 to 4 business hours.
                                    </p>
                                    <button
                                        onClick={() => setIsSuccess(false)}
                                        className="px-8 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
                                    >
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name input */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6605c7]">Full Name</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 text-lg">person</span>
                                                <input 
                                                    type="text" 
                                                    name="name" 
                                                    required 
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Enter your name"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-white/40 hover:bg-white/60 border border-gray-200 focus:border-[#6605c7]/50 focus:bg-white text-[13.5px] rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Email input */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6605c7]">Email Address</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 text-lg">mail</span>
                                                <input 
                                                    type="email" 
                                                    name="email" 
                                                    required 
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="Enter your email"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-white/40 hover:bg-white/60 border border-gray-200 focus:border-[#6605c7]/50 focus:bg-white text-[13.5px] rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Phone input */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6605c7]">Phone Number</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 text-lg">call</span>
                                                <input 
                                                    type="tel" 
                                                    name="phone" 
                                                    required 
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="Enter mobile number"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-white/40 hover:bg-white/60 border border-gray-200 focus:border-[#6605c7]/50 focus:bg-white text-[13.5px] rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Subject selector */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6605c7]">Primary Inquiry</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 text-lg">help</span>
                                                <select 
                                                    name="subject" 
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-8 py-3.5 bg-white/40 hover:bg-white/60 border border-gray-200 focus:border-[#6605c7]/50 focus:bg-white text-[13.5px] rounded-xl outline-none transition-all text-gray-900 font-medium appearance-none cursor-pointer shadow-sm"
                                                >
                                                    <option className="bg-white text-gray-900" value="Loan Eligibility">Loan Eligibility Help</option>
                                                    <option className="bg-white text-gray-900" value="Document Upload">DigiLocker / Document Upload</option>
                                                    <option className="bg-white text-gray-900" value="Bank Verification">Bank Partner Pre-Verification</option>
                                                    <option className="bg-white text-gray-900" value="Partner Integration">Lender Integrations Desk</option>
                                                    <option className="bg-white text-gray-900" value="General Inquiry">Other Questions</option>
                                                </select>
                                                <span className="material-symbols-outlined text-[#6605c7] absolute right-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">expand_more</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Message textarea */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6605c7]">Your Message</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined text-gray-400 absolute left-4 top-4 text-lg">chat</span>
                                            <textarea 
                                                name="message" 
                                                required 
                                                rows={5}
                                                value={formData.message}
                                                onChange={handleChange}
                                                placeholder="Detail your request, university intended, or application number..."
                                                className="w-full pl-12 pr-4 py-3.5 bg-white/40 hover:bg-white/60 border border-gray-200 focus:border-[#6605c7]/50 focus:bg-white text-[13.5px] rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium resize-none shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Tactile 3D Submit Button */}
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full relative group py-4.5 text-white font-extrabold rounded-xl transition-all shadow-[0_12px_36px_rgba(102,5,199,0.25)] active:translate-y-0.5 active:shadow-inner text-xs uppercase tracking-widest cursor-pointer disabled:opacity-50"
                                            style={{ background: 'linear-gradient(135deg, #6605c7, #8b24e5)' }}
                                        >
                                            {isSubmitting ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Processing...
                                                </div>
                                            ) : (
                                                <span className="flex items-center justify-center gap-1.5">
                                                    Send Message
                                                    <span className="material-symbols-outlined text-sm font-extrabold">send</span>
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Office Address Directories */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Direct Contacts Info Card */}
                        <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl p-8 space-y-6 shadow-xl">
                            <h3 className="text-lg font-bold font-display text-gray-900">Direct Contacts</h3>
                            
                            <div className="space-y-4">
                                <a href="mailto:support@vidyaloans.in" className="flex items-center gap-4 group p-3 bg-white/20 hover:bg-white/60 border border-gray-100 hover:border-purple-500/20 rounded-2xl transition-all shadow-sm">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-lg">mail</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block mb-0.5">Email Support</span>
                                        <span className="text-[13px] font-bold text-gray-900 group-hover:text-[#6605c7] transition-colors font-mono">support@vidyaloan.in</span>
                                    </div>
                                </a>

                                <a href="tel:+919240209000" className="flex items-center gap-4 group p-3 bg-white/20 hover:bg-white/60 border border-gray-100 hover:border-purple-500/20 rounded-2xl transition-all shadow-sm">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-lg">call</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block mb-0.5">Call Helpline</span>
                                        <span className="text-[13px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors font-mono">+91 9240209000</span>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Physical Offices Card */}
                        <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-xl">
                            <h3 className="text-lg font-bold font-display text-gray-900 mb-6">Our Offices</h3>
                            
                            <div className="space-y-6 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                                {offices.map((office) => (
                                    <div 
                                        key={office.city}
                                        className="relative group p-4 border border-gray-100 rounded-2xl bg-white/20 hover:bg-white hover:border-[#6605c7]/20 transition-all duration-300 shadow-sm"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-[#6605c7] text-xl mt-0.5">location_on</span>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[14px] font-bold text-gray-900">{office.city}</span>
                                                    {office.city === "Hyderabad" && (
                                                        <span className="text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                                                            HQ
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">{office.role}</span>
                                                <p className="text-[12px] text-gray-500 leading-relaxed font-medium pt-1">{office.address}</p>
                                                <a href={`tel:${office.phone.replace(/\s+/g, '')}`} className="text-[11px] font-bold text-[#6605c7] hover:text-[#8b24e5] inline-block pt-1 font-mono">
                                                    {office.phone}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
}

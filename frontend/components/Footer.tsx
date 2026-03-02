import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="bg-[#0c0714] text-white relative overflow-hidden">
            {/* Subtle gradient glow at top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#6605c7]/5 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-6 pt-20 pb-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">

                    {/* Brand Column */}
                    <div className="lg:col-span-3">
                        <Link href="/" className="flex items-center gap-2 mb-6 group">
                            <div className="w-9 h-9 bg-[#6605c7] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[#6605c7]/20 group-hover:shadow-[#6605c7]/30 transition-shadow">
                                <span className="material-symbols-outlined text-white text-xl">school</span>
                            </div>
                            <span className="text-xl font-bold font-display tracking-tight text-white">VidhyaLoan</span>
                        </Link>
                        <p className="text-gray-400 text-[13px] leading-relaxed mb-8 max-w-xs font-normal">
                            Empowering students with transparent, flexible, and accessible education financing solutions worldwide.
                        </p>

                        {/* Social Icons */}
                        <div className="flex items-center gap-2.5 mb-8">
                            <SocialIcon href="#" icon="https://img.icons8.com/ios-filled/16/ffffff/instagram-new.png" alt="Instagram" color="hover:bg-[#E1306C]" />
                            <SocialIcon href="#" icon="https://img.icons8.com/ios-filled/16/ffffff/linkedin.png" alt="LinkedIn" color="hover:bg-[#0077B5]" />
                            <SocialIcon href="#" icon="https://img.icons8.com/ios-filled/16/ffffff/youtube-play.png" alt="YouTube" color="hover:bg-red-600" />
                            <SocialIcon href="#" icon="https://img.icons8.com/ios-filled/16/ffffff/twitterx--v1.png" alt="Twitter" color="hover:bg-black" />
                            <SocialIcon href="#" icon="https://img.icons8.com/ios-filled/16/ffffff/whatsapp.png" alt="WhatsApp" color="hover:bg-green-600" />
                        </div>

                        {/* Contact */}
                        <div className="space-y-2.5">
                            <a href="mailto:support@vidhyaloan.in" className="flex items-center gap-2.5 text-gray-400 hover:text-white text-[13px] transition-colors group">
                                <span className="material-symbols-outlined text-base text-gray-500 group-hover:text-[#6605c7] transition-colors">mail</span>
                                support@Vidhyaloan.in
                            </a>
                            <a href="tel:+919240209000" className="flex items-center gap-2.5 text-gray-400 hover:text-white text-[13px] transition-colors group">
                                <span className="material-symbols-outlined text-base text-gray-500 group-hover:text-[#6605c7] transition-colors">call</span>
                                +91 9240209000
                            </a>
                        </div>
                    </div>

                    {/* About VidhyaLoan */}
                    <div className="lg:col-span-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white mb-6">About VidhyaLoan</h4>
                        <ul className="space-y-3 text-[13px]">
                            <FooterLink href="/about-us" label="Our Story" />
                            <FooterLink href="/how-it-works" label="How It Works" />
                            <FooterLink href="/privacy-policy" label="Privacy Policy" />
                            <FooterLink href="/terms-conditions" label="Terms & Conditions" />
                            <FooterLink href="/cookies" label="Cookie Policy" />
                            <FooterLink href="/contact" label="Contact Us" />
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="lg:col-span-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white mb-6">Resources</h4>
                        <ul className="space-y-3 text-[13px]">
                            <FooterLink href="/compare-universities" label="University Selection" />
                            <FooterLink href="/compare-loans" label="Education Loans" />
                            <FooterLink href="/blog" label="Blogs & News" />
                            <FooterLink href="/bank-reviews" label="Bank Reviews" />
                            <FooterLink href="/faq" label="FAQ" />
                            <FooterLink href="/explore" label="Community" />
                        </ul>
                    </div>

                    {/* AI Tools */}
                    <div className="lg:col-span-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white mb-6">AI Tools</h4>
                        <ul className="space-y-3 text-[13px]">
                            <FooterLink href="/emi" label="EMI Calculator" />
                            <FooterLink href="/loan-eligibility" label="Eligibility Checker" />
                            <FooterLink href="/sop-writer" label="SOP Writer" />
                            <FooterLink href="/grade-converter" label="Grade Converter" />
                            <FooterLink href="/admit-predictor" label="Admit Predictor" />
                            <FooterLink href="/repayment-stress" label="Stress Simulator" />
                        </ul>
                    </div>

                    {/* Offices */}
                    <div className="lg:col-span-3">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white mb-6">Offices</h4>
                        <ul className="space-y-3 text-[13px]">
                            <li className="flex items-start gap-2 text-gray-400">
                                <span className="material-symbols-outlined text-[#6605c7] text-base mt-0.5">location_on</span>
                                <div>
                                    <span className="text-white font-medium block">Hyderabad</span>
                                    <span className="text-[11px] text-gray-500">Headquarters</span>
                                </div>
                            </li>
                            {["Bangalore", "Mumbai", "Delhi", "Chennai"].map((city) => (
                                <li key={city} className="flex items-start gap-2.5 text-gray-400">
                                    <span className="material-symbols-outlined text-[#6605c7] text-base mt-0.5">location_on</span>
                                    {city}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/[0.06]">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-[11px] text-gray-500 order-3 md:order-1 font-normal opacity-80">
                            &copy; 2026 VidhyaLoan Inc. All rights reserved.
                        </p>

                        {/* Made in India */}
                        <p className="text-[11px] text-gray-400 order-2 md:order-3 flex items-center gap-1.5 font-normal opacity-80">
                            Made with <span className="text-red-400/80">❤</span> in India for students worldwide
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialIcon({ href, icon, alt, color }: { href: string; icon: string; alt: string; color: string }) {
    return (
        <a
            href={href}
            className={`w-8 h-8 bg-white/[0.05] ${color} rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg`}
        >
            <img src={icon} alt={alt} className="w-[14px] h-[14px] opacity-70 group-hover:opacity-100" />
        </a>
    );
}

function FooterLink({ href, label }: { href: string; label: string }) {
    return (
        <li>
            <Link href={href} className="text-gray-400/80 hover:text-white transition-colors inline-block font-normal">
                {label}
            </Link>
        </li>
    );
}

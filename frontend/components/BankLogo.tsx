import React from 'react';

export const BANK_LOGO_MAP: { match: string; logo: string }[] = [
    { match: 'idfc', logo: '/images/lenders/idfc-first-bank.jpg' },
    { match: 'credila', logo: '/images/lenders/hdfc-credila.png' },
    { match: 'hdfc', logo: '/images/lenders/hdfc-credila.png' },
    { match: 'auxilo', logo: '/images/lenders/auxilo.png' },
    { match: 'avanse', logo: '/images/lenders/avanse.jpg' },
    { match: 'poonawalla', logo: '/images/lenders/poonawalla.png' },
];

interface BankLogoProps {
    bankName: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'wide';
    minimal?: boolean;
}

const BankLogo = ({ bankName, className = "", size = 'md', minimal = false }: BankLogoProps) => {
    const lower = (bankName || '').toLowerCase();
    const entry = BANK_LOGO_MAP.find(b => lower.includes(b.match));
    const initials = (bankName || '').split(' ').map((w: string) => w[0]).filter(Boolean).join('').slice(0, 3).toUpperCase();

    const sizeClasses = {
        sm: 'w-8 h-8 rounded-lg',
        md: 'w-10 h-10 rounded-xl',
        lg: 'w-16 h-16 rounded-2xl',
        wide: 'w-24 h-8 rounded-md'
    };

    if (!bankName) {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <div className={`${sizeClasses[size]} bg-slate-50/50 border border-slate-100 flex items-center justify-center shadow-inner`}>
                    <span className="material-symbols-outlined text-slate-300 text-[18px]">account_balance</span>
                </div>
                {!minimal && size !== 'lg' && <span className="text-[12px] font-semibold text-slate-400 italic">No Target Bank</span>}
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-3 group/logo transition-all ${className}`}>
            <div className={`${sizeClasses[size]} ${minimal ? 'bg-transparent' : 'bg-white border border-slate-200 shadow-sm'} flex-shrink-0 overflow-hidden ${minimal ? 'p-0' : 'p-1.5'} flex items-center justify-center group-hover/logo:scale-105 transition-all duration-300`}>
                {entry ? (
                    <img
                        src={entry.logo}
                        alt={bankName}
                        className={`w-full h-full object-contain group-hover/logo:scale-85 transition-transform duration-500 ${minimal ? 'mix-blend-multiply' : ''}`}
                        onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            el.style.display = 'none';
                            const span = document.createElement('span');
                            span.className = 'text-[11px] font-black text-indigo-600 tracking-tighter';
                            span.textContent = initials;
                            el.parentElement?.appendChild(span);
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center rounded-md">
                        <span className="text-[11px] font-black text-indigo-600 tracking-tighter">{initials}</span>
                    </div>
                )}
            </div>
            {!minimal && size !== 'lg' && (
                <div className="min-w-0">
                    <span className="text-[13px] font-bold text-slate-800 leading-tight block truncate">{bankName}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mt-0.5">Primary Lender</span>
                </div>
            )}
        </div>
    );
};

export default BankLogo;

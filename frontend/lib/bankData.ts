
export interface BankData {
    name: string;
    slug: string;
    logo: string;
    rating: string;
    description: string;
    interestRate: string;
    maxLoan: string;
    approvalTime: string;
    primaryColor: string;
    gradient: string;
    stats: {
        studentsFunded: string;
        universitiesCovered: string;
        countriesSupported: string;
        customerRating: string;
    };
    features: {
        icon: string;
        title: string;
        desc: string;
        iconColor: string;
        bgColor: string;
    }[];
    specifications: {
        label: string;
        value: string;
    }[];
    eligibility: {
        title: string;
        desc: string;
    }[];
    documents: {
        icon: string;
        title: string;
        desc: string;
        color: string;
    }[];
    courses: {
        icon: string;
        title: string;
        color: string;
    }[];
    uniqueFeatures: {
        icon: string;
        title: string;
        desc: string;
    }[];
}

export const banks: Record<string, BankData> = {
    "idfc": {
        name: "IDFC First Bank",
        slug: "idfc",
        logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/IDFC_First_Bank_logo.jpg",
        rating: "4.5",
        description: "Achieve your study abroad dreams with IDFC First Bank's flexible education loans. Competitive rates starting at 10.5% p.a. with up to ₹40 lakhs coverage.",
        interestRate: "10.5%",
        maxLoan: "₹40L",
        approvalTime: "48h",
        primaryColor: "#EC1C24",
        gradient: "linear-gradient(135deg, #EC1C24 0%, #B71519 100%)",
        stats: {
            studentsFunded: "25,000+",
            universitiesCovered: "800+",
            countriesSupported: "35+",
            customerRating: "4.5★"
        },
        features: [
            { icon: "percent", title: "Competitive Rates", desc: "Starting at 10.5% p.a. with flexible tenure options", iconColor: "text-red-500", bgColor: "bg-red-500/10" },
            { icon: "account_balance", title: "High Loan Amount", desc: "Up to ₹40 lakhs without collateral", iconColor: "text-blue-500", bgColor: "bg-blue-500/10" },
            { icon: "schedule", title: "Quick Processing", desc: "Sanction letter in as quick as 48 hours", iconColor: "text-green-500", bgColor: "bg-green-500/10" },
            { icon: "payments", title: "Flexible Repayment", desc: "Moratorium period during course + 1 year", iconColor: "text-orange-500", bgColor: "bg-orange-500/10" }
        ],
        specifications: [
            { label: "Interest Rate", value: "10.5% - 12.5% p.a." },
            { label: "Loan Amount", value: "Up to ₹40 Lakhs" },
            { label: "Processing Fee", value: "1% + GST" },
            { label: "Repayment Tenure", value: "Up to 15 years" },
            { label: "Moratorium Period", value: "Course + 12 months" },
            { label: "Collateral", value: "Not required up to ₹40L" }
        ],
        eligibility: [
            { title: "Admission Confirmed", desc: "From recognized university abroad" },
            { title: "Co-Applicant Required", desc: "Parent or guardian with income proof" },
            { title: "Age Limit", desc: "18-35 years for the student" },
            { title: "Academic Record", desc: "Good academic track record required" }
        ],
        documents: [
            { icon: "badge", title: "Identity Proof", desc: "Passport, Aadhaar, PAN Card", color: "red" },
            { icon: "school", title: "Admission Letter", desc: "From the university/college", color: "blue" },
            { icon: "history_edu", title: "Academic Records", desc: "10th, 12th, UG marksheets", color: "green" },
            { icon: "account_balance_wallet", title: "Income Proof", desc: "Salary slips, ITR, statements", color: "purple" },
            { icon: "flight", title: "Visa & Travel", desc: "Valid passport, visa (if available)", color: "orange" },
            { icon: "receipt_long", title: "Fee Structure", desc: "Detailed breakdown from uni", color: "pink" }
        ],
        courses: [
            { icon: "computer", title: "MS in CS", color: "red" },
            { icon: "business", title: "MBA", color: "blue" },
            { icon: "biotech", title: "MS in Data Science", color: "green" },
            { icon: "engineering", title: "MS Engineering", color: "purple" },
            { icon: "local_hospital", title: "MBBS / MD", color: "orange" },
            { icon: "gavel", title: "LLM / Law", color: "pink" }
        ],
        uniqueFeatures: [
            { icon: "speed", title: "48-Hour Fast Track", desc: "One of the fastest processing times in the industry. Get sanctioned in just 2 working days." },
            { icon: "savings", title: "Zero Margin Money", desc: "No upfront margin money required. 100% of tuition and living expenses covered." },
            { icon: "support_agent", title: "Dedicated RM", desc: "Personal loan advisor who guides you through every step from application to disbursement." }
        ]
    },
    "auxilo": {
        name: "Auxilo Finserve",
        slug: "auxilo",
        logo: "https://www.studentcover.in/auxilo_no_bg.png",
        rating: "4.4",
        description: "Auxilo is a next-gen education finance company providing customized loan solutions for students aspiring to study in India and overseas.",
        interestRate: "11.25%",
        maxLoan: "No Limit",
        approvalTime: "72h",
        primaryColor: "#005CAB",
        gradient: "linear-gradient(135deg, #005CAB 0%, #003D73 100%)",
        stats: {
            studentsFunded: "15,000+",
            universitiesCovered: "1000+",
            countriesSupported: "40+",
            customerRating: "4.4★"
        },
        features: [
            { icon: "history_edu", title: "100% Financing", desc: "Covering tuition, living, travel and even laptop costs", iconColor: "text-blue-500", bgColor: "bg-blue-500/10" },
            { icon: "verified", title: "Customized Loans", desc: "Tailored to your specific course and financial needs", iconColor: "text-purple-500", bgColor: "bg-purple-500/10" },
            { icon: "bolt", title: "Fast Disbursement", desc: "Quick fund transfer once sanction letter is issued", iconColor: "text-yellow-500", bgColor: "bg-yellow-500/10" },
            { icon: "public", title: "Global Coverage", desc: "Support for 900+ global universities across 20 countries", iconColor: "text-green-500", bgColor: "bg-green-500/10" }
        ],
        specifications: [
            { label: "Interest Rate", value: "11.25% - 13.5% p.a." },
            { label: "Loan Amount", value: "No Upper Limit" },
            { label: "Processing Fee", value: "1% - 2% + GST" },
            { label: "Repayment Tenure", value: "Up to 10 years" },
            { label: "Moratorium Period", value: "Course Duration + 6 months" },
            { label: "Collateral", value: "Both Secured & Unsecured" }
        ],
        eligibility: [
            { title: "Indian Citizenship", desc: "Applicant must be an Indian citizen" },
            { title: "Admission Proof", desc: "Confimed admission in recognized institute" },
            { title: "Co-Applicant", desc: "Parent/Guardian/Spouse with stable income" },
            { title: "Academic Record", desc: "Consistently good academic performance" }
        ],
        documents: [
            { icon: "badge", title: "KYC Documents", desc: "Aadhaar, PAN, Passport", color: "blue" },
            { icon: "school", title: "Academic Details", desc: "Marksheets, Entrance scores", color: "purple" },
            { icon: "description", title: "Admission Letter", desc: "Cost of study breakdown", color: "green" },
            { icon: "account_balance", title: "Bank Statements", desc: "Last 6 months of co-applicant", color: "orange" },
            { icon: "receipt", title: "Income Proof", desc: "Latest ITR and Salary Slips", color: "red" },
            { icon: "photo_camera", title: "Photographs", desc: "Passport size photos", color: "teal" }
        ],
        courses: [
            { icon: "science", title: "STEM Programs", color: "blue" },
            { icon: "trending_up", title: "Management / MBA", color: "green" },
            { icon: "medical_services", title: "Medical Studies", color: "red" },
            { icon: "palette", title: "Creative Arts", color: "purple" },
            { icon: "psychology", title: "Social Sciences", color: "orange" },
            { icon: "law", title: "Law Programs", color: "indigo" }
        ],
        uniqueFeatures: [
            { icon: "handshake", title: "Holistic Assessment", desc: "We look beyond just scores, considering your potential and career trajectory." },
            { icon: "payments", title: "Pre-Admission Sanction", desc: "Get your loan sanctioned even before you get your final admission letter." },
            { icon: "support", title: "Student-First approach", desc: "Dedicated support team to help with visa documentation and fund transfers." }
        ]
    },
    // Adding other banks with summarized info for now to keep it concise but functional
    "avanse": {
        name: "Avanse Financial",
        slug: "avanse",
        logo: "https://mma.prnewswire.com/media/1986642/Avanse_Logo.jpg?p=facebook",
        rating: "4.6",
        description: "Avanse Financial Services is a leading education-focused NBFC that provides hyper-personalized loan solutions.",
        interestRate: "10.99%",
        maxLoan: "No Limit",
        approvalTime: "4 days",
        primaryColor: "#0091DA",
        gradient: "linear-gradient(135deg, #0091DA 0%, #005CAB 100%)",
        stats: { studentsFunded: "20k+", universitiesCovered: "1200+", countriesSupported: "45+", customerRating: "4.6★" },
        features: [{ icon: "percent", title: "Best Rates", desc: "From 10.99% p.a.", iconColor: "text-blue-500", bgColor: "bg-blue-50/10" }],
        specifications: [{ label: "Interest Rate", value: "10.99% onwards" }],
        eligibility: [{ title: "Academic Proof", desc: "Marksheets and transcripts" }],
        documents: [{ icon: "badge", title: "ID Proof", desc: "KYC docs", color: "blue" }],
        courses: [{ icon: "school", title: "All Masters", color: "blue" }],
        uniqueFeatures: [{ icon: "bolt", title: "Hyper-speed", desc: "Fastest sanctioning process" }]
    },
    "credila": {
        name: "HDFC Credila",
        slug: "credila",
        logo: "https://www.credila.com/images/Credila-Logo.png",
        rating: "4.8",
        description: "HDFC Credila is India's first dedicated education loan provider, a subsidiary of HDFC Bank.",
        interestRate: "10.75%",
        maxLoan: "No Limit",
        approvalTime: "5 days",
        primaryColor: "#004B8D",
        gradient: "linear-gradient(135deg, #004B8D 0%, #002D54 100%)",
        stats: { studentsFunded: "50k+", universitiesCovered: "2500+", countriesSupported: "50+", customerRating: "4.8★" },
        features: [{ icon: "verified", title: "Trusted Brand", desc: "Backed by HDFC", iconColor: "text-blue-600", bgColor: "bg-blue-50/10" }],
        specifications: [{ label: "Interest Rate", value: "10.75% onwards" }],
        eligibility: [{ title: "Admission Letter", desc: "From top global unis" }],
        documents: [{ icon: "badge", title: "KYC", desc: "Standard banking docs", color: "indigo" }],
        courses: [{ icon: "computer", title: "Tech Courses", color: "indigo" }],
        uniqueFeatures: [{ icon: "account_balance", title: "Bank Backed", desc: "High stability and trust" }]
    },
    "poonawalla": {
        name: "Poonawalla Fincorp",
        slug: "poonawalla",
        logo: "https://collegepond.com/wp-content/uploads/2025/03/image-8.png",
        rating: "4.3",
        description: "Poonawalla Fincorp offers hassle-free education loans with minimal documentation and attractive terms.",
        interestRate: "11.50%",
        maxLoan: "₹50L",
        approvalTime: "3 days",
        primaryColor: "#F47920",
        gradient: "linear-gradient(135deg, #F47920 0%, #C85911 100%)",
        stats: { studentsFunded: "10k+", universitiesCovered: "500+", countriesSupported: "25+", customerRating: "4.3★" },
        features: [{ icon: "speed", title: "Digital First", desc: "Paperless application", iconColor: "text-orange-500", bgColor: "bg-orange-50/10" }],
        specifications: [{ label: "Interest Rate", value: "11.50% onwards" }],
        eligibility: [{ title: "Credit Score", desc: "Healthy credit history required" }],
        documents: [{ icon: "description", title: "Online Submission", desc: "Digital copies preferred", color: "orange" }],
        courses: [{ icon: "business", title: "Management", color: "orange" }],
        uniqueFeatures: [{ icon: "smartphone", title: "Mobile Tracking", desc: "Track application on app" }]
    }
};

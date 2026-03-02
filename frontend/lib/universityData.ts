
export interface UniversityData {
    slug: string;
    name: string;
    shortName: string;
    location: string;
    country: string;
    countryCode: string;
    flag: string;
    founded: number;
    type: string; // Public / Private
    rank: number;
    rankBy: string; // QS, THE, etc.
    acceptanceRate: number;
    tuition: number;
    currency: string;
    description: string;
    heroImage: string;
    campusImages: string[];
    logo: string;
    primaryColor: string;
    gradient: string;
    badge: string;
    website: string;
    stats: {
        totalStudents: string;
        internationalStudents: string;
        facultyRatio: string;
        researchOutput: string;
        employmentRate: string;
        avgSalary: string;
    };
    programs: {
        name: string;
        degree: string;
        duration: string;
        tuition: string;
        icon: string;
    }[];
    topRecruiters: string[];
    requirements: {
        gpa: string;
        ielts: string;
        toefl: string;
        gre: string;
    };
    loanInfo: {
        availableLenders: string[];
        avgLoanAmount: string;
        collateralFree: boolean;
        fastTrack: boolean;
        notes: string;
    };
    pros: string[];
    campusFacilities: { icon: string; name: string }[];
}

export const universities: Record<string, UniversityData> = {
    "mit": {
        slug: "mit",
        name: "Massachusetts Institute of Technology",
        shortName: "MIT",
        location: "Cambridge, Massachusetts",
        country: "USA",
        countryCode: "us",
        flag: "🇺🇸",
        founded: 1861,
        type: "Private Research University",
        rank: 1,
        rankBy: "QS World Rankings 2024",
        acceptanceRate: 7,
        tuition: 57986,
        currency: "USD",
        description: "MIT is the world's leading institution for science, technology, engineering, and mathematics. With an unmatched culture of innovation and entrepreneurship, MIT graduates have founded over 30,000 companies generating $1.9 trillion in annual revenue.",
        heroImage: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1400&q=80",
        campusImages: [
            "https://images.unsplash.com/photo-1523050335392-93851179ae22?w=600&q=80",
            "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=600&q=80",
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80",
        ],
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/800px-MIT_logo.svg.png",
        primaryColor: "#A31F34",
        gradient: "linear-gradient(135deg, #A31F34 0%, #800000 100%)",
        badge: "World #1",
        website: "https://web.mit.edu",
        stats: {
            totalStudents: "11,500+",
            internationalStudents: "38%",
            facultyRatio: "3:1",
            researchOutput: "$3.5B/yr",
            employmentRate: "97%",
            avgSalary: "$120K",
        },
        programs: [
            { name: "MS in Computer Science", degree: "Masters", duration: "2 years", tuition: "$57,986/yr", icon: "computer" },
            { name: "MS in Electrical Engineering", degree: "Masters", duration: "2 years", tuition: "$57,986/yr", icon: "bolt" },
            { name: "MS in Data Science", degree: "Masters", duration: "1.5 years", tuition: "$57,986/yr", icon: "analytics" },
            { name: "MS in AI & ML", degree: "Masters", duration: "2 years", tuition: "$57,986/yr", icon: "psychology" },
            { name: "MBA (Sloan School)", degree: "MBA", duration: "2 years", tuition: "$80,000/yr", icon: "business_center" },
        ],
        topRecruiters: ["Google", "Microsoft", "Amazon", "Apple", "Meta", "Tesla", "Goldman Sachs", "McKinsey"],
        requirements: { gpa: "9.0+ / 10", ielts: "7.0+", toefl: "100+", gre: "160+" },
        loanInfo: {
            availableLenders: ["HDFC Credila", "Avanse", "Auxilo", "IDFC First Bank"],
            avgLoanAmount: "₹55 - 90 Lakhs",
            collateralFree: true,
            fastTrack: true,
            notes: "MIT is on the approved university list of all major Indian lenders. Fast-track approvals available within 48 hours.",
        },
        pros: [
            "World's #1 ranked university for Engineering & CS",
            "97% placement rate within 6 months of graduation",
            "Access to MIT's $50B+ endowment-funded research labs",
            "Strong alumni network of 130,000+ leaders worldwide",
            "Located in the heart of the Boston-Cambridge tech hub",
        ],
        campusFacilities: [
            { icon: "science", name: "World-Class Labs" },
            { icon: "local_library", name: "5 Major Libraries" },
            { icon: "sports_basketball", name: "26 Athletic Teams" },
            { icon: "restaurant", name: "Dining & Housing" },
            { icon: "health_and_safety", name: "Medical Center" },
            { icon: "hub", name: "Innovation Ecosystem" },
        ],
    },

    "stanford": {
        slug: "stanford",
        name: "Stanford University",
        shortName: "Stanford",
        location: "Stanford, California",
        country: "USA",
        countryCode: "us",
        flag: "🇺🇸",
        founded: 1885,
        type: "Private Research University",
        rank: 3,
        rankBy: "QS World Rankings 2024",
        acceptanceRate: 4,
        tuition: 62484,
        currency: "USD",
        description: "Stanford University, nestled in the heart of Silicon Valley, is a world-class institution known for its entrepreneurial culture, cutting-edge research, and close ties to industry leaders like Google, HP, and Netflix — all of which were founded by Stanford alumni.",
        heroImage: "https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=1400&q=80",
        campusImages: [
            "https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80",
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80",
            "https://images.unsplash.com/photo-1523050335392-93851179ae22?w=600&q=80",
        ],
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_Cardinal_logo.svg/800px-Stanford_Cardinal_logo.svg.png",
        primaryColor: "#8C1515",
        gradient: "linear-gradient(135deg, #8C1515 0%, #5E0000 100%)",
        badge: "Silicon Valley Hub",
        website: "https://www.stanford.edu",
        stats: {
            totalStudents: "17,000+",
            internationalStudents: "24%",
            facultyRatio: "4:1",
            researchOutput: "$5.0B/yr",
            employmentRate: "98%",
            avgSalary: "$130K",
        },
        programs: [
            { name: "MS in Computer Science", degree: "Masters", duration: "1-2 years", tuition: "$62,484/yr", icon: "computer" },
            { name: "MBA (Stanford GSB)", degree: "MBA", duration: "2 years", tuition: "$75,480/yr", icon: "business_center" },
            { name: "MS in Data Science", degree: "Masters", duration: "1.5 years", tuition: "$62,484/yr", icon: "analytics" },
            { name: "MS in AI", degree: "Masters", duration: "2 years", tuition: "$62,484/yr", icon: "psychology" },
        ],
        topRecruiters: ["Google", "Apple", "Facebook", "McKinsey", "Bain", "Goldman Sachs", "Sequoia Capital", "Andreessen Horowitz"],
        requirements: { gpa: "9.2+ / 10", ielts: "7.0+", toefl: "100+", gre: "165+" },
        loanInfo: {
            availableLenders: ["HDFC Credila", "Avanse", "Auxilo", "Axis Bank"],
            avgLoanAmount: "₹60 - 1 Cr",
            collateralFree: true,
            fastTrack: true,
            notes: "Stanford MS admits get priority processing from most Indian NBFCs. VidhyaLoan partners can get same-day pre-approval.",
        },
        pros: [
            "Located in Silicon Valley — internship & job hub",
            "Home to the Stanford d.school (Design Thinking pioneers)",
            "Access to 18+ libraries and 8,000+ online courses",
            "Over 22 billionaires are Stanford alumni",
            "Generous financial aid for international students",
        ],
        campusFacilities: [
            { icon: "school", name: "8,100 Acre Campus" },
            { icon: "hospital", name: "Stanford Medical Center" },
            { icon: "hub", name: "StartX Accelerator" },
            { icon: "sports", name: "36 Varsity Sports" },
            { icon: "local_library", name: "Green Library" },
            { icon: "apartment", name: "Campus Housing" },
        ],
    },

    "cmu": {
        slug: "cmu",
        name: "Carnegie Mellon University",
        shortName: "CMU",
        location: "Pittsburgh, Pennsylvania",
        country: "USA",
        countryCode: "us",
        flag: "🇺🇸",
        founded: 1900,
        type: "Private Research University",
        rank: 22,
        rankBy: "QS World Rankings 2024",
        acceptanceRate: 17,
        tuition: 58924,
        currency: "USD",
        description: "Carnegie Mellon University is globally acclaimed as the #1 university for Computer Science. Its School of Computer Science and Tepper School of Business are consistently ranked among the best, producing the most AI researchers in the world.",
        heroImage: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1400&q=80",
        campusImages: [
            "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=600&q=80",
            "https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80",
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80",
        ],
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Carnegie_Mellon_University_seal.svg/800px-Carnegie_Mellon_University_seal.svg.png",
        primaryColor: "#C41230",
        gradient: "linear-gradient(135deg, #C41230 0%, #8B0000 100%)",
        badge: "CS Powerhouse",
        website: "https://www.cmu.edu",
        stats: {
            totalStudents: "14,000+",
            internationalStudents: "47%",
            facultyRatio: "4:1",
            researchOutput: "$1.8B/yr",
            employmentRate: "96%",
            avgSalary: "$115K",
        },
        programs: [
            { name: "MS in Computer Science", degree: "Masters", duration: "1.5 - 2 years", tuition: "$58,924/yr", icon: "computer" },
            { name: "MS in Machine Learning", degree: "Masters", duration: "1.5 years", tuition: "$58,924/yr", icon: "psychology" },
            { name: "MS in Robotics", degree: "Masters", duration: "2 years", tuition: "$58,924/yr", icon: "precision_manufacturing" },
            { name: "MS in Software Engineering", degree: "Masters", duration: "1.5 years", tuition: "$58,924/yr", icon: "code" },
            { name: "MBA (Tepper)", degree: "MBA", duration: "2 years", tuition: "$72,000/yr", icon: "business_center" },
        ],
        topRecruiters: ["Google DeepMind", "OpenAI", "Microsoft Research", "Amazon", "Apple", "Uber", "Carnegie Robotics", "NVIDIA"],
        requirements: { gpa: "8.5+ / 10", ielts: "6.5+", toefl: "94+", gre: "160+" },
        loanInfo: {
            availableLenders: ["HDFC Credila", "Avanse", "Auxilo", "IDFC First Bank", "Poonawalla"],
            avgLoanAmount: "₹50 - 85 Lakhs",
            collateralFree: true,
            fastTrack: true,
            notes: "CMU has high loan approval rates due to strong placement stats. Collateral-free loans up to ₹75L available for CMU admits.",
        },
        pros: [
            "#1 ranked CS program in the United States",
            "Home to one of the world's best robotics programs",
            "Silicon Valley-level tech job placements",
            "High Indian student population — vibrant community",
            "Industry partnerships with FAANG companies",
        ],
        campusFacilities: [
            { icon: "computer", name: "Robotics Institute" },
            { icon: "science", name: "AI Research Labs" },
            { icon: "theater_comedy", name: "Arts Programs" },
            { icon: "apartment", name: "Graduate Housing" },
            { icon: "local_library", name: "Hunt Library" },
            { icon: "sports", name: "Fitness Centers" },
        ],
    },

    "oxford": {
        slug: "oxford",
        name: "University of Oxford",
        shortName: "Oxford",
        location: "Oxford, England",
        country: "UK",
        countryCode: "gb",
        flag: "🇬🇧",
        founded: 1096,
        type: "Public Research University",
        rank: 1,
        rankBy: "THE World University Rankings 2024",
        acceptanceRate: 17,
        tuition: 30500,
        currency: "GBP",
        description: "The University of Oxford is the oldest English-language university in the world and home to 28 Nobel Prize winners since 1960. Oxford's tutorial-based learning system and its 44 colleges create an unparalleled academic community.",
        heroImage: "https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=1400&q=80",
        campusImages: [
            "https://images.unsplash.com/photo-1612599316791-451087c7fe15?w=600&q=80",
            "https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=600&q=80",
            "https://images.unsplash.com/photo-1547981609-4b6f0d6e1e38?w=600&q=80",
        ],
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Oxford-University-Circlet.svg/800px-Oxford-University-Circlet.svg.png",
        primaryColor: "#002147",
        gradient: "linear-gradient(135deg, #002147 0%, #001030 100%)",
        badge: "UK #1 / World #1",
        website: "https://www.ox.ac.uk",
        stats: {
            totalStudents: "24,000+",
            internationalStudents: "46%",
            facultyRatio: "5:1",
            researchOutput: "£1.1B/yr",
            employmentRate: "95%",
            avgSalary: "$100K",
        },
        programs: [
            { name: "MSc in Computer Science", degree: "Masters", duration: "1 year", tuition: "£30,500/yr", icon: "computer" },
            { name: "MBA (Saïd Business School)", degree: "MBA", duration: "1 year", tuition: "£68,000/yr", icon: "business_center" },
            { name: "MSc in Data Science", degree: "Masters", duration: "1 year", tuition: "£30,500/yr", icon: "analytics" },
            { name: "MSc in AI", degree: "Masters", duration: "1 year", tuition: "£30,500/yr", icon: "psychology" },
        ],
        topRecruiters: ["Goldman Sachs", "McKinsey", "BCG", "Google", "Amazon", "UK Civil Service", "JP Morgan", "Deutsche Bank"],
        requirements: { gpa: "8.5+ / 10", ielts: "7.0+", toefl: "110+", gre: "N/A" },
        loanInfo: {
            availableLenders: ["HDFC Credila", "Avanse", "Axis Bank"],
            avgLoanAmount: "₹40 - 70 Lakhs",
            collateralFree: false,
            fastTrack: false,
            notes: "Oxford is in the UK, hence most loans require property collateral for amounts above ₹40L. Post-Study Work Visa allows 2 years of work in UK.",
        },
        pros: [
            "World's most prestigious academic institution",
            "One-on-one tutorial system for personalized learning",
            "1-year accelerated programs save tuition costs",
            "UK Post-Study Work Visa: 2 years post-graduation",
            "44 colleges, each with its own culture and community",
        ],
        campusFacilities: [
            { icon: "local_library", name: "Bodleian Library (1602)" },
            { icon: "science", name: "Research Institutes" },
            { icon: "museum", name: "Ashmolean Museum" },
            { icon: "rowing", name: "Rowing & Sports Clubs" },
            { icon: "restaurant", name: "College Dining Halls" },
            { icon: "school", name: "44 Colleges" },
        ],
    },

    "toronto": {
        slug: "toronto",
        name: "University of Toronto",
        shortName: "UofT",
        location: "Toronto, Ontario",
        country: "Canada",
        countryCode: "ca",
        flag: "🇨🇦",
        founded: 1827,
        type: "Public Research University",
        rank: 18,
        rankBy: "QS World Rankings 2024",
        acceptanceRate: 43,
        tuition: 43000,
        currency: "CAD",
        description: "The University of Toronto is Canada's top-ranked university and a global leader in research with over $1.5 billion invested annually. Located in the heart of Toronto — Canada's tech and financial capital — UofT offers unparalleled industry connections.",
        heroImage: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=1400&q=80",
        campusImages: [
            "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=600&q=80",
            "https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80",
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80",
        ],
        logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Utoronto_coa.svg/800px-Utoronto_coa.svg.png",
        primaryColor: "#002A5C",
        gradient: "linear-gradient(135deg, #002A5C 0%, #001840 100%)",
        badge: "Canada #1",
        website: "https://www.utoronto.ca",
        stats: {
            totalStudents: "90,000+",
            internationalStudents: "25%",
            facultyRatio: "17:1",
            researchOutput: "$1.5B/yr",
            employmentRate: "93%",
            avgSalary: "CAD $80K",
        },
        programs: [
            { name: "MScAC in Applied Computing", degree: "Masters", duration: "1 year", tuition: "CAD $43,000/yr", icon: "computer" },
            { name: "MEng in Engineering", degree: "Masters", duration: "1 year", tuition: "CAD $38,000/yr", icon: "engineering" },
            { name: "MBA (Rotman)", degree: "MBA", duration: "2 years", tuition: "CAD $98,000 total", icon: "business_center" },
            { name: "MSc in Data Science", degree: "Masters", duration: "1.5 years", tuition: "CAD $43,000/yr", icon: "analytics" },
        ],
        topRecruiters: ["Shopify", "RBC", "TD Bank", "Google Canada", "Amazon Canada", "Scotiabank", "IBM", "Accenture"],
        requirements: { gpa: "7.5+ / 10", ielts: "6.5+", toefl: "93+", gre: "Optional" },
        loanInfo: {
            availableLenders: ["HDFC Credila", "Avanse", "Auxilo", "IDFC First Bank", "Poonawalla"],
            avgLoanAmount: "₹35 - 60 Lakhs",
            collateralFree: true,
            fastTrack: true,
            notes: "Canada offers PGWP (Post-Graduation Work Permit), making loan repayment easier. UofT admits get pre-approval from all major lenders.",
        },
        pros: [
            "Canada allows 3-year Post-Graduation Work Permit",
            "Toronto is the 4th largest tech hub in North America",
            "More affordable than US universities with similar rankings",
            "Canada's path to PR is straightforward for graduates",
            "Access to UofT's 100+ research institutes",
        ],
        campusFacilities: [
            { icon: "local_library", name: "Robarts Library" },
            { icon: "science", name: "Research Centers" },
            { icon: "sports_basketball", name: "Athletic Center" },
            { icon: "restaurant", name: "40+ Dining Halls" },
            { icon: "apartment", name: "Graduate Student Housing" },
            { icon: "hub", name: "Entrepreneurship Hatchery" },
        ],
    },

    "melbourne": {
        slug: "melbourne",
        name: "University of Melbourne",
        shortName: "UniMelb",
        location: "Melbourne, Victoria",
        country: "Australia",
        countryCode: "au",
        flag: "🇦🇺",
        founded: 1853,
        type: "Public Research University",
        rank: 33,
        rankBy: "QS World Rankings 2024",
        acceptanceRate: 70,
        tuition: 42000,
        currency: "AUD",
        description: "The University of Melbourne is Australia's leading university and the southern hemisphere's top-ranked institution. Part of Australia's prestigious Group of Eight, it offers a vibrant multicultural campus in one of the world's most livable cities.",
        heroImage: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1400&q=80",
        campusImages: [
            "https://images.unsplash.com/photo-1542621334-a254cf47733d?w=600&q=80",
            "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=600&q=80",
            "https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80",
        ],
        logo: "https://upload.wikimedia.org/wikipedia/en/thumb/3/36/University_of_Melbourne_logo.svg/800px-University_of_Melbourne_logo.svg.png",
        primaryColor: "#003F88",
        gradient: "linear-gradient(135deg, #003F88 0%, #002255 100%)",
        badge: "Australia #1",
        website: "https://www.unimelb.edu.au",
        stats: {
            totalStudents: "50,000+",
            internationalStudents: "40%",
            facultyRatio: "10:1",
            researchOutput: "AUD $1B/yr",
            employmentRate: "91%",
            avgSalary: "AUD $75K",
        },
        programs: [
            { name: "Master of Computer Science", degree: "Masters", duration: "2 years", tuition: "AUD $42,000/yr", icon: "computer" },
            { name: "Master of Data Science", degree: "Masters", duration: "2 years", tuition: "AUD $42,000/yr", icon: "analytics" },
            { name: "MBA (Melbourne Business School)", degree: "MBA", duration: "2 years", tuition: "AUD $68,000/yr", icon: "business_center" },
            { name: "MEng (Engineering)", degree: "Masters", duration: "2 years", tuition: "AUD $40,000/yr", icon: "engineering" },
        ],
        topRecruiters: ["Telstra", "ANZ Bank", "Deloitte", "PwC", "KPMG", "Amazon Australia", "Google Australia", "BHP"],
        requirements: { gpa: "7.0+ / 10", ielts: "6.5+", toefl: "79+", gre: "Optional" },
        loanInfo: {
            availableLenders: ["HDFC Credila", "Avanse", "Auxilo"],
            avgLoanAmount: "₹30 - 55 Lakhs",
            collateralFree: true,
            fastTrack: false,
            notes: "Australia's Temporary Graduate visa (subclass 485) allows 2-4 years of work post-graduation, easing loan repayment.",
        },
        pros: [
            "Australia's Temporary Graduate visa (485) for 2-4 years",
            "Melbourne consistently ranked world's most liveable city",
            "Australia's #1 research university",
            "Strong financial aid and scholarship programs",
            "Lower tuition than comparable US/UK universities",
        ],
        campusFacilities: [
            { icon: "local_library", name: "Baillieu Library" },
            { icon: "science", name: "Bio21 Institute" },
            { icon: "sports", name: "University Sport" },
            { icon: "restaurant", name: "Union House" },
            { icon: "apartment", name: "Graduate Housing" },
            { icon: "theater_comedy", name: "Arts Centre" },
        ],
    },

    "tum": {
        slug: "tum",
        name: "Technical University of Munich",
        shortName: "TUM",
        location: "Munich, Bavaria",
        country: "Germany",
        countryCode: "de",
        flag: "🇩🇪",
        founded: 1868,
        type: "Public Technical University",
        rank: 37,
        rankBy: "QS World Rankings 2024",
        acceptanceRate: 8,
        tuition: 2600,
        currency: "EUR",
        description: "The Technical University of Munich is Germany's top-ranked university and one of Europe's leading technical institutions. Famous for near-zero tuition fees, TUM combines rigorous engineering education with strong industry partnerships in BMW, Siemens, and MAN.",
        heroImage: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1400&q=80",
        campusImages: [
            "https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=600&q=80",
            "https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80",
            "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=600&q=80",
        ],
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Logo_of_the_Technical_University_of_Munich.svg/800px-Logo_of_the_Technical_University_of_Munich.svg.png",
        primaryColor: "#3070B3",
        gradient: "linear-gradient(135deg, #3070B3 0%, #0050AA 100%)",
        badge: "Near-Free Tuition",
        website: "https://www.tum.de",
        stats: {
            totalStudents: "48,000+",
            internationalStudents: "35%",
            facultyRatio: "8:1",
            researchOutput: "€1.5B/yr",
            employmentRate: "94%",
            avgSalary: "€55K",
        },
        programs: [
            { name: "MSc in Computer Science", degree: "Masters", duration: "2 years", tuition: "€2,600 semester fee/yr", icon: "computer" },
            { name: "MSc in Electrical Engineering", degree: "Masters", duration: "2 years", tuition: "€2,600 semester fee/yr", icon: "bolt" },
            { name: "MSc in Robotics", degree: "Masters", duration: "2 years", tuition: "€2,600 semester fee/yr", icon: "precision_manufacturing" },
            { name: "MSc in Data Engineering", degree: "Masters", duration: "2 years", tuition: "€2,600 semester fee/yr", icon: "analytics" },
            { name: "MSc in Mechanical Engineering", degree: "Masters", duration: "2 years", tuition: "€2,600 semester fee/yr", icon: "engineering" },
        ],
        topRecruiters: ["BMW", "Siemens", "Audi", "SAP", "Allianz", "Google Germany", "Amazon Germany", "Bosch"],
        requirements: { gpa: "8.0+ / 10", ielts: "6.5+", toefl: "88+", gre: "Optional" },
        loanInfo: {
            availableLenders: ["HDFC Credila", "Avanse", "SBI"],
            avgLoanAmount: "₹20 - 40 Lakhs",
            collateralFree: true,
            fastTrack: false,
            notes: "TUM's near-zero tuition makes loan amounts much smaller. Germany's 18-month Job Seeker visa post-graduation is excellent for repayment. Germany loans are usually for living costs only.",
        },
        pros: [
            "Near-zero tuition — pay only ~€2,600/yr in semester fees",
            "Home to BMW, Siemens global R&D headquarters",
            "Germany grants 18-month Job Seeker Visa after graduation",
            "Most programs available in English",
            "Top 40 globally — elite academic credentials",
        ],
        campusFacilities: [
            { icon: "science", name: "TUM Research Centers" },
            { icon: "local_library", name: "University Library" },
            { icon: "sports", name: "Hochschulsport Sports" },
            { icon: "restaurant", name: "Studentenwerk Mensa" },
            { icon: "apartment", name: "Student Housing" },
            { icon: "hub", name: "UnternehmerTUM Hub" },
        ],
    },

    "trinity-dublin": {
        slug: "trinity-dublin",
        name: "Trinity College Dublin",
        shortName: "Trinity",
        location: "Dublin, Ireland",
        country: "Ireland",
        countryCode: "ie",
        flag: "🇮🇪",
        founded: 1592,
        type: "Public Research University",
        rank: 81,
        rankBy: "QS World Rankings 2024",
        acceptanceRate: 30,
        tuition: 22000,
        currency: "EUR",
        description: "Founded in 1592, Trinity College Dublin is Ireland's oldest and most prestigious university. At the heart of Europe's fastest-growing tech hub, with Google, Facebook, Apple, LinkedIn, and Twitter all headquartered in Dublin, Trinity graduates are in high demand.",
        heroImage: "https://images.unsplash.com/photo-1564959130747-897fb406b9af?w=1400&q=80",
        campusImages: [
            "https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=600&q=80",
            "https://images.unsplash.com/photo-1612599316791-451087c7fe15?w=600&q=80",
            "https://images.unsplash.com/photo-1547981609-4b6f0d6e1e38?w=600&q=80",
        ],
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Trinity_College_Dublin_Logo.svg/800px-Trinity_College_Dublin_Logo.svg.png",
        primaryColor: "#006AA7",
        gradient: "linear-gradient(135deg, #006AA7 0%, #00457A 100%)",
        badge: "EU Tech Hub",
        website: "https://www.tcd.ie",
        stats: {
            totalStudents: "19,000+",
            internationalStudents: "32%",
            facultyRatio: "12:1",
            researchOutput: "€350M/yr",
            employmentRate: "92%",
            avgSalary: "€55K",
        },
        programs: [
            { name: "MSc in Computer Science", degree: "Masters", duration: "1 year", tuition: "€22,000/yr", icon: "computer" },
            { name: "MSc in Data Science", degree: "Masters", duration: "1 year", tuition: "€22,000/yr", icon: "analytics" },
            { name: "MBA (Smurfit GSB)", degree: "MBA", duration: "1 year", tuition: "€35,000/yr", icon: "business_center" },
            { name: "MSc in Engineering", degree: "Masters", duration: "1.5 years", tuition: "€20,000/yr", icon: "engineering" },
        ],
        topRecruiters: ["Google", "Meta", "LinkedIn", "Apple", "Twitter/X", "Amazon EU", "Accenture", "Deloitte"],
        requirements: { gpa: "7.5+ / 10", ielts: "6.5+", toefl: "90+", gre: "Optional" },
        loanInfo: {
            availableLenders: ["HDFC Credila", "Avanse", "Auxilo", "IDFC First Bank"],
            avgLoanAmount: "₹30 - 50 Lakhs",
            collateralFree: true,
            fastTrack: false,
            notes: "Ireland's Graduate Visa allows 2 years stay post-graduation. Dublin's tech scene ensures strong ROI. Loan amounts are moderate given lower tuition vs. US.",
        },
        pros: [
            "Google, Apple, Meta European HQs are in Dublin",
            "Shorter 1-year masters programs save time and money",
            "EU Stamp 1G: 2-year post-study work authorization",
            "Campus located in central Dublin — world-class city",
            "Lower cost of study compared to UK equivalents",
        ],
        campusFacilities: [
            { icon: "local_library", name: "Old Library (Book of Kells)" },
            { icon: "science", name: "Trinity Research Labs" },
            { icon: "sports", name: "Sports Grounds" },
            { icon: "restaurant", name: "Dining Hall" },
            { icon: "apartment", name: "Campus Accommodation" },
            { icon: "hub", name: "Innovation Hub (Dogpatch)" },
        ],
    },
};

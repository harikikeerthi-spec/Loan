"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Starting reference data seeding...');
                    // ==================== LOAN TYPES ====================
                    console.log('📋 Seeding Loan Types...');
                    return [4 /*yield*/, prisma.loanType.createMany({
                            data: [
                                {
                                    name: 'Education Loan - Abroad Studies',
                                    category: 'Secured',
                                    description: 'Comprehensive loan for pursuing higher education at international universities. Covers tuition fees, living expenses, travel, and other educational costs.',
                                    features: ['Up to 100% funding', 'No collateral up to ₹7.5L', 'Flexible repayment', 'Moratorium period during studies', 'Tax benefits under Section 80E'],
                                    eligibility: 'Must have admission letter from recognized foreign university. Co-applicant (parent/guardian) required.',
                                    documentsRequired: ['Admission Letter', 'Passport', 'Income Proof of Co-applicant', 'Academic Records', 'Bank Statements', 'Property Documents (if applicable)'],
                                    interestRateMin: 7.5,
                                    interestRateMax: 12.0,
                                    loanAmountMin: '₹1,00,000',
                                    loanAmountMax: '₹1,50,00,000',
                                    repaymentPeriod: '5-15 years',
                                    processingTime: '7-14 days',
                                    isPopular: true,
                                },
                                {
                                    name: 'Education Loan - Domestic Studies',
                                    category: 'Secured',
                                    description: 'Loan for studying at premier institutions within India including IITs, IIMs, AIIMS, and other recognized universities.',
                                    features: ['Lower interest rates', 'Quick approval', 'Subsidy schemes available', 'No processing fee for government schemes'],
                                    eligibility: 'Admission to recognized Indian institution. Good academic record required.',
                                    documentsRequired: ['Admission Letter', 'Aadhar Card', 'Income Proof', 'Academic Records', 'Fee Structure'],
                                    interestRateMin: 6.5,
                                    interestRateMax: 10.0,
                                    loanAmountMin: '₹50,000',
                                    loanAmountMax: '₹50,00,000',
                                    repaymentPeriod: '5-10 years',
                                    processingTime: '5-10 days',
                                    isPopular: true,
                                },
                                {
                                    name: 'Collateral-Free Education Loan',
                                    category: 'Unsecured',
                                    description: 'Education loan without any collateral security. Ideal for loans up to ₹7.5 lakhs.',
                                    features: ['No collateral required', 'Faster approval', 'Competitive rates', 'Third-party guarantee accepted'],
                                    eligibility: 'Strong academic record. Co-borrower with stable income required.',
                                    documentsRequired: ['Admission Letter', 'ID Proof', 'Income Proof of Co-borrower', 'Academic Records'],
                                    interestRateMin: 9.0,
                                    interestRateMax: 14.0,
                                    loanAmountMin: '₹50,000',
                                    loanAmountMax: '₹7,50,000',
                                    repaymentPeriod: '5-7 years',
                                    processingTime: '3-7 days',
                                    isPopular: false,
                                },
                            ],
                            skipDuplicates: true,
                        })];
                case 1:
                    _a.sent();
                    // ==================== BANKS ====================
                    console.log('🏦 Seeding Banks...');
                    return [4 /*yield*/, prisma.bank.createMany({
                            data: [
                                {
                                    name: 'State Bank of India (SBI)',
                                    shortName: 'SBI',
                                    country: 'India',
                                    type: 'Public',
                                    loanTypes: ['Education Loan', 'Personal Loan', 'Home Loan'],
                                    educationLoan: true,
                                    interestRateMin: 7.5,
                                    interestRateMax: 10.5,
                                    maxLoanAmount: '₹1.5 Crore',
                                    collateralRequired: false,
                                    collateralFreeLimit: '₹7.5 Lakhs',
                                    processingFee: '₹10,000 or 1% (whichever is lower)',
                                    processingTime: '7-10 days',
                                    features: ['Lowest interest rates in India', 'Quick approval process', 'Online application', 'Branch network across India', 'Tax benefits under 80E'],
                                    website: 'https://sbi.co.in',
                                    contactNumber: '1800 1234 567',
                                    email: 'education.loan@sbi.co.in',
                                    isPopular: true,
                                },
                                {
                                    name: 'HDFC Bank',
                                    shortName: 'HDFC',
                                    country: 'India',
                                    type: 'Private',
                                    loanTypes: ['Education Loan', 'Personal Loan', 'Vehicle Loan'],
                                    educationLoan: true,
                                    interestRateMin: 8.0,
                                    interestRateMax: 11.5,
                                    maxLoanAmount: '₹1 Crore',
                                    collateralRequired: false,
                                    collateralFreeLimit: '₹7.5 Lakhs',
                                    processingFee: '1% of loan amount',
                                    processingTime: '5-7 days',
                                    features: ['Fast processing', 'Flexible repayment', 'Digital application', 'Dedicated relationship manager'],
                                    website: 'https://hdfcbank.com',
                                    contactNumber: '1800 202 6161',
                                    email: 'educationloan@hdfcbank.com',
                                    isPopular: true,
                                },
                                {
                                    name: 'ICICI Bank',
                                    shortName: 'ICICI',
                                    country: 'India',
                                    type: 'Private',
                                    loanTypes: ['Education Loan', 'Personal Loan'],
                                    educationLoan: true,
                                    interestRateMin: 8.5,
                                    interestRateMax: 12.0,
                                    maxLoanAmount: '₹1 Crore',
                                    collateralRequired: false,
                                    collateralFreeLimit: '₹7.5 Lakhs',
                                    processingFee: '1.5% or ₹10,000 (whichever is higher)',
                                    processingTime: '7-10 days',
                                    features: ['Competitive rates', 'Wide network', 'Online tracking', 'Pre-approved offers'],
                                    website: 'https://icicibank.com',
                                    contactNumber: '1860 120 7777',
                                    email: 'educationloan@icicibank.com',
                                    isPopular: true,
                                },
                                {
                                    name: 'Axis Bank',
                                    shortName: 'Axis',
                                    country: 'India',
                                    type: 'Private',
                                    loanTypes: ['Education Loan', 'Personal Loan'],
                                    educationLoan: true,
                                    interestRateMin: 8.0,
                                    interestRateMax: 11.0,
                                    maxLoanAmount: '₹75 Lakhs',
                                    collateralRequired: false,
                                    collateralFreeLimit: '₹7.5 Lakhs',
                                    processingFee: '1% of loan amount',
                                    processingTime: '5-7 days',
                                    features: ['Quick disbursal', 'Easy documentation', 'Moratorium period', 'Special rates for premier institutions'],
                                    website: 'https://axisbank.com',
                                    contactNumber: '1860 500 5555',
                                    email: 'education@axisbank.com',
                                    isPopular: false,
                                },
                                {
                                    name: 'Credila Financial Services',
                                    shortName: 'Credila',
                                    country: 'India',
                                    type: 'NBFC',
                                    loanTypes: ['Education Loan'],
                                    educationLoan: true,
                                    interestRateMin: 9.0,
                                    interestRateMax: 13.5,
                                    maxLoanAmount: '₹1 Crore',
                                    collateralRequired: false,
                                    collateralFreeLimit: '₹7.5 Lakhs',
                                    processingFee: '1-2% of loan amount',
                                    processingTime: '3-5 days',
                                    features: ['Specialized in education loans', 'Study abroad experts', 'Fast approval', 'Covers all universities worldwide'],
                                    website: 'https://credila.com',
                                    contactNumber: '1800 102 7070',
                                    email: 'info@credila.com',
                                    isPopular: false,
                                },
                            ],
                            skipDuplicates: true,
                        })];
                case 2:
                    _a.sent();
                    // ==================== COUNTRIES ====================
                    console.log('🌍 Seeding Countries...');
                    return [4 /*yield*/, prisma.country.createMany({
                            data: [
                                {
                                    name: 'United States',
                                    code: 'US',
                                    region: 'North America',
                                    popularForStudy: true,
                                    universities: 4000,
                                    averageTuitionFee: '$25,000-$55,000/year',
                                    averageLivingCost: '$12,000-$18,000/year',
                                    studyDuration: '1-2 years for Masters, 4 years for Bachelors',
                                    visaType: 'F-1 Student Visa',
                                    visaProcessingTime: '3-5 weeks',
                                    workPermit: true,
                                    postStudyWorkVisa: 'OPT (12-36 months for STEM)',
                                    popularCities: ['New York', 'Boston', 'San Francisco', 'Los Angeles', 'Chicago', 'Austin'],
                                    currency: 'USD',
                                    language: ['English'],
                                    description: 'The USA is home to many of the world\'s top-ranked universities and offers excellent opportunities for international students. Known for cutting-edge research, diverse culture, and strong job market.',
                                },
                                {
                                    name: 'United Kingdom',
                                    code: 'UK',
                                    region: 'Europe',
                                    popularForStudy: true,
                                    universities: 160,
                                    averageTuitionFee: '£15,000-£30,000/year',
                                    averageLivingCost: '£12,000-£15,000/year',
                                    studyDuration: '1 year for Masters, 3 years for Bachelors',
                                    visaType: 'Student Visa (Tier 4)',
                                    visaProcessingTime: '2-3 weeks',
                                    workPermit: true,
                                    postStudyWorkVisa: 'Graduate Route (2 years, 3 years for PhD)',
                                    popularCities: ['London', 'Oxford', 'Cambridge', 'Edinburgh', 'Manchester'],
                                    currency: 'GBP',
                                    language: ['English'],
                                    description: 'UK universities are globally recognized for academic excellence. Shorter course duration and rich cultural heritage make it an attractive destination.',
                                },
                                {
                                    name: 'Canada',
                                    code: 'CA',
                                    region: 'North America',
                                    popularForStudy: true,
                                    universities: 200,
                                    averageTuitionFee: 'CAD 15,000-35,000/year',
                                    averageLivingCost: 'CAD 12,000-15,000/year',
                                    studyDuration: '1-2 years for Masters, 4 years for Bachelors',
                                    visaType: 'Study Permit',
                                    visaProcessingTime: '4-6 weeks',
                                    workPermit: true,
                                    postStudyWorkVisa: 'PGWP (up to 3 years)',
                                    popularCities: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary'],
                                    currency: 'CAD',
                                    language: ['English', 'French'],
                                    description: 'Canada offers high-quality education, affordable tuition, and excellent immigration opportunities. Known for welcoming international students.',
                                },
                                {
                                    name: 'Australia',
                                    code: 'AU',
                                    region: 'Oceania',
                                    popularForStudy: true,
                                    universities: 43,
                                    averageTuitionFee: 'AUD 20,000-45,000/year',
                                    averageLivingCost: 'AUD 18,000-25,000/year',
                                    studyDuration: '1.5-2 years for Masters, 3-4 years for Bachelors',
                                    visaType: 'Student Visa (Subclass 500)',
                                    visaProcessingTime: '4-6 weeks',
                                    workPermit: true,
                                    postStudyWorkVisa: 'Temporary Graduate Visa (2-4 years)',
                                    popularCities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
                                    currency: 'AUD',
                                    language: ['English'],
                                    description: 'Australia is known for its world-class education system, beautiful landscapes, and high quality of life. Strong focus on research and innovation.',
                                },
                                {
                                    name: 'Germany',
                                    code: 'DE',
                                    region: 'Europe',
                                    popularForStudy: true,
                                    universities: 400,
                                    averageTuitionFee: '€0-€3,000/year (Public universities)',
                                    averageLivingCost: '€10,000-€12,000/year',
                                    studyDuration: '2 years for Masters, 3-4 years for Bachelors', visaType: 'Student Visa (National Visa)',
                                    visaProcessingTime: '6-8 weeks',
                                    workPermit: true,
                                    postStudyWorkVisa: '18 months job seeker visa',
                                    popularCities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Stuttgart'],
                                    currency: 'EUR',
                                    language: ['German', 'English'],
                                    description: 'Germany offers tuition-free or low-cost education at public universities. Strong in engineering, technology, and research.',
                                },
                            ],
                            skipDuplicates: true,
                        })];
                case 3:
                    _a.sent();
                    // ==================== UNIVERSITIES ====================
                    console.log('🏛️ Seeding Universities...');
                    return [4 /*yield*/, prisma.university.createMany({
                            data: [
                                {
                                    name: 'Harvard University',
                                    country: 'United States',
                                    city: 'Cambridge',
                                    state: 'Massachusetts',
                                    ranking: 1,
                                    worldRanking: 1,
                                    type: 'Private',
                                    established: 1636,
                                    website: 'https://www.harvard.edu',
                                    description: 'Harvard University is the oldest institution of higher education in the United States. Known for exceptional faculty, groundbreaking research, and global influence.',
                                    popularCourses: ['MBA', 'Law', 'Medicine', 'Computer Science', 'Economics'],
                                    averageFees: '$50,000-$75,000/year',
                                    acceptanceRate: 3.43,
                                    scholarships: true,
                                    isFeatured: true,
                                },
                                {
                                    name: 'Stanford University',
                                    country: 'United States',
                                    city: 'Stanford',
                                    state: 'California',
                                    ranking: 2,
                                    worldRanking: 3,
                                    type: 'Private',
                                    established: 1885,
                                    website: 'https://www.stanford.edu',
                                    description: 'Located in Silicon Valley, Stanford is a leader in entrepreneurship, innovation, and technology education.',
                                    popularCourses: ['Computer Science', 'Engineering', 'MBA', 'Medicine'],
                                    averageFees: '$55,000-$78,000/year',
                                    acceptanceRate: 3.95,
                                    scholarships: true,
                                    isFeatured: true,
                                },
                                {
                                    name: 'Massachusetts Institute of Technology (MIT)',
                                    country: 'United States',
                                    city: 'Cambridge',
                                    state: 'Massachusetts',
                                    ranking: 3,
                                    worldRanking: 1,
                                    type: 'Private',
                                    established: 1861,
                                    website: 'https://www.mit.edu',
                                    description: 'MIT is world-renowned for science, technology, engineering, and mathematics education.',
                                    popularCourses: ['Engineering', 'Computer Science', 'Physics', 'Economics'],
                                    averageFees: '$53,000-$77,000/year',
                                    acceptanceRate: 3.96,
                                    scholarships: true,
                                    isFeatured: true,
                                },
                                {
                                    name: 'University of Oxford',
                                    country: 'United Kingdom',
                                    city: 'Oxford',
                                    ranking: 1,
                                    worldRanking: 2,
                                    type: 'Public',
                                    established: 1096,
                                    website: 'https://www.ox.ac.uk',
                                    description: 'The oldest university in the English-speaking world. Oxford is synonymous with academic excellence.',
                                    popularCourses: ['PPE', 'Law', 'Medicine', 'English Literature', 'History'],
                                    averageFees: '£25,000-£37,000/year',
                                    acceptanceRate: 17.5,
                                    scholarships: true,
                                    isFeatured: true,
                                },
                                {
                                    name: 'University of Cambridge',
                                    country: 'United Kingdom',
                                    city: 'Cambridge',
                                    ranking: 2,
                                    worldRanking: 3,
                                    type: 'Public',
                                    established: 1209,
                                    website: 'https://www.cam.ac.uk',
                                    description: 'Cambridge is one of the world\'s leading universities with a rich history of academic achievement.',
                                    popularCourses: ['Natural Sciences', 'Mathematics', 'Engineering', 'Law'],
                                    averageFees: '£24,000-£34,000/year',
                                    acceptanceRate: 21.0,
                                    scholarships: true,
                                    isFeatured: true,
                                },
                                {
                                    name: 'University of Toronto',
                                    country: 'Canada',
                                    city: 'Toronto',
                                    state: 'Ontario',
                                    ranking: 1,
                                    worldRanking: 18,
                                    type: 'Public',
                                    established: 1827,
                                    website: 'https://www.utoronto.ca',
                                    description: 'Canada\'s top university and a leading research institution globally.',
                                    popularCourses: ['Computer Science', 'Engineering', 'Medicine', 'Business'],
                                    averageFees: 'CAD 45,000-55,000/year',
                                    acceptanceRate: 43.0,
                                    scholarships: true,
                                    isFeatured: true,
                                },
                            ],
                            skipDuplicates: true,
                        })];
                case 4:
                    _a.sent();
                    // ==================== SCHOLARSHIPS ====================
                    console.log('💰 Seeding Scholarships...');
                    return [4 /*yield*/, prisma.scholarship.createMany({
                            data: [
                                {
                                    name: 'Fulbright Scholarship',
                                    provider: 'US Department of State',
                                    country: 'United States',
                                    eligibleCountries: ['India', 'Pakistan', 'Bangladesh', 'Nepal', 'All'],
                                    amount: 'Full tuition + living expenses + airfare',
                                    type: 'Merit-based',
                                    description: 'The Fulbright Program provides grants for international educational exchange for students, scholars, teachers, professionals, and artists.',
                                    eligibility: 'Bachelor\'s degree with strong academic record. Demonstrated leadership potential and English proficiency required.',
                                    applicationProcess: 'Online application through USIEF. Submit essays, recommendations, academic transcripts. Interview required.',
                                    deadline: 'May 15 annually',
                                    website: 'https://foreign.fulbrightonline.org',
                                    isActive: true,
                                },
                                {
                                    name: 'Chevening Scholarship',
                                    provider: 'UK Government',
                                    country: 'United Kingdom',
                                    eligibleCountries: ['India', 'Pakistan', 'All'],
                                    amount: 'Full tuition + monthly stipend + travel costs',
                                    type: 'Merit-based',
                                    description: 'Chevening Scholarships enable outstanding emerging leaders from around the world to pursue one-year master\'s degrees in the UK.',
                                    eligibility: 'Undergraduate degree, 2+ years work experience, leadership potential, return to home country requirement.',
                                    applicationProcess: 'Online application. Three references, unconditional university offers, interview.',
                                    deadline: 'November 2 annually',
                                    website: 'https://www.chevening.org',
                                    isActive: true,
                                },
                                {
                                    name: 'Vanier Canada Graduate Scholarships',
                                    provider: 'Government of Canada',
                                    country: 'Canada',
                                    eligibleCountries: ['All'],
                                    amount: 'CAD 50,000/year for 3 years',
                                    type: 'Merit-based',
                                    description: 'Prestigious scholarship for doctoral students demonstrating leadership and high academic achievement.',
                                    eligibility: 'Nominated by Canadian university. Excellence in research, leadership, and academic performance.',
                                    applicationProcess: 'University nomination required. Submit research proposal, transcripts, references.',
                                    deadline: 'November annually',
                                    website: 'https://vanier.gc.ca',
                                    isActive: true,
                                },
                            ],
                            skipDuplicates: true,
                        })];
                case 5:
                    _a.sent();
                    // ==================== COURSES ====================
                    console.log('📚 Seeding Courses...');
                    return [4 /*yield*/, prisma.course.createMany({
                            data: [
                                {
                                    name: 'Master of Business Administration (MBA)',
                                    level: 'Masters',
                                    field: 'Business',
                                    duration: '1-2 years',
                                    description: 'MBA programs prepare students for leadership roles in business and management through comprehensive business education.',
                                    averageFees: '$40,000-$150,000',
                                    popularCountries: ['USA', 'UK', 'Canada', 'Australia'],
                                    careerProspects: ['CEO', 'Management Consultant', 'Investment Banker', 'Entrepreneur', 'Product Manager'],
                                    averageSalary: '$80,000-$180,000',
                                    isPopular: true,
                                },
                                {
                                    name: 'Master of Science in Computer Science',
                                    level: 'Masters',
                                    field: 'Engineering',
                                    duration: '1-2 years',
                                    description: 'Advanced study in algorithms, artificial intelligence, machine learning, and software engineering.',
                                    averageFees: '$30,000-$70,000',
                                    popularCountries: ['USA', 'UK', 'Canada', 'Germany'],
                                    careerProspects: ['Software Engineer', 'Data Scientist', 'AI Researcher', 'Tech Lead', 'Solutions Architect'],
                                    averageSalary: '$90,000-$160,000',
                                    isPopular: true,
                                },
                                {
                                    name: 'Master of Science in Data Science',
                                    level: 'Masters',
                                    field: 'Engineering',
                                    duration: '1-2 years',
                                    description: 'Combines statistics, programming, and domain expertise to extract insights from data.',
                                    averageFees: '$35,000-$65,000',
                                    popularCountries: ['USA', 'UK', 'Canada', 'Australia'],
                                    careerProspects: ['Data Scientist', 'Machine Learning Engineer', 'Data Analyst', 'Business Intelligence Analyst'],
                                    averageSalary: '$85,000-$150,000',
                                    isPopular: true,
                                },
                                {
                                    name: 'Doctor of Medicine (MD)',
                                    level: 'Doctorate',
                                    field: 'Medicine',
                                    duration: '4-6 years',
                                    description: 'Professional degree for those pursuing a career in medicine and healthcare.',
                                    averageFees: '$50,000-$90,000/year',
                                    popularCountries: ['USA', 'UK', 'Australia', 'Canada'],
                                    careerProspects: ['Doctor', 'Surgeon', 'Medical Researcher', 'Specialist Physician'],
                                    averageSalary: '$200,000-$400,000',
                                    isPopular: false,
                                },
                                {
                                    name: 'Bachelor of Engineering (B.E./B.Tech)',
                                    level: 'Undergraduate',
                                    field: 'Engineering',
                                    duration: '4 years',
                                    description: 'Undergraduate engineering degree covering various specializations.',
                                    averageFees: '$20,000-$50,000/year',
                                    popularCountries: ['USA', 'UK', 'Canada', 'Germany', 'Australia'],
                                    careerProspects: ['Engineer', 'Software Developer', 'Product Manager', 'Technical Consultant'],
                                    averageSalary: '$60,000-$100,000',
                                    isPopular: true,
                                },
                            ],
                            skipDuplicates: true,
                        })];
                case 6:
                    _a.sent();
                    console.log('✅ Reference data seeding completed successfully!');
                    console.log('\n📊 Summary:');
                    console.log('- Loan Types: 3 records');
                    console.log('- Banks: 5 records');
                    console.log('- Countries: 5 records');
                    console.log('- Universities: 6 records');
                    console.log('- Scholarships: 3 records');
                    console.log('- Courses: 5 records');
                    console.log('\n🚀 You can now test the API endpoints!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });

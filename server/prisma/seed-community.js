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
function seedCommunity() {
    return __awaiter(this, void 0, void 0, function () {
        var mentors, now, events, stories, resources;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Seeding community data...');
                    return [4 /*yield*/, Promise.all([
                            prisma.mentor.create({
                                data: {
                                    name: 'Priya Sharma',
                                    email: 'priya.sharma@example.com',
                                    phone: '+1-555-0101',
                                    university: 'Stanford University',
                                    degree: 'MS in Computer Science',
                                    country: 'USA',
                                    loanBank: 'HDFC Credila',
                                    loanAmount: '₹40,00,000',
                                    interestRate: '9.5%',
                                    loanType: 'Education Loan',
                                    category: 'Engineering',
                                    linkedIn: 'https://linkedin.com/in/priyasharma',
                                    bio: 'Software Engineer at Google. Helped 50+ students navigate the US education loan process. Specialized in STEM programs and scholarship applications.',
                                    expertise: ['Loan Application', 'Visa Process', 'Scholarships', 'STEM Programs'],
                                    rating: 4.9,
                                    studentsMentored: 52,
                                    isApproved: true,
                                    isActive: true,
                                },
                            }),
                            prisma.mentor.create({
                                data: {
                                    name: 'Rahul Mehta',
                                    email: 'rahul.mehta@example.com',
                                    phone: '+44-20-1234-5678',
                                    university: 'London School of Economics',
                                    degree: 'MBA',
                                    country: 'UK',
                                    loanBank: 'Avanse',
                                    loanAmount: '₹35,00,000',
                                    interestRate: '10.25%',
                                    loanType: 'Education Loan',
                                    category: 'Business',
                                    linkedIn: 'https://linkedin.com/in/rahulmehta',
                                    bio: 'Investment Banker in London. Expertise in MBA admissions and education financing for business schools across Europe.',
                                    expertise: ['MBA Programs', 'Business Schools', 'UK Education', 'Finance'],
                                    rating: 4.8,
                                    studentsMentored: 38,
                                    isApproved: true,
                                    isActive: true,
                                },
                            }),
                            prisma.mentor.create({
                                data: {
                                    name: 'Ananya Iyer',
                                    email: 'ananya.iyer@example.com',
                                    university: 'University of Toronto',
                                    degree: 'MS in Data Science',
                                    country: 'Canada',
                                    loanBank: 'Auxilo',
                                    loanAmount: '₹30,00,000',
                                    interestRate: '9.75%',
                                    category: 'Data Science',
                                    bio: 'Data Scientist at Amazon. Passionate about helping students pursue data science and AI programs in Canada.',
                                    expertise: ['Data Science', 'AI/ML', 'Canada Education', 'Tech Careers'],
                                    rating: 4.7,
                                    studentsMentored: 29,
                                    isApproved: true,
                                    isActive: true,
                                },
                            }),
                        ])];
                case 1:
                    mentors = _a.sent();
                    console.log("\u2705 Created ".concat(mentors.length, " mentors"));
                    now = new Date();
                    return [4 /*yield*/, Promise.all([
                            prisma.communityEvent.create({
                                data: {
                                    title: 'Education Loan Masterclass 2026',
                                    description: 'Comprehensive guide to securing education loans for studying abroad. Learn about loan types, documentation, and approval strategies.',
                                    type: 'webinar',
                                    category: 'Finance',
                                    date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                                    time: '18:00',
                                    duration: 90,
                                    speaker: 'Dr. Amit Patel',
                                    speakerTitle: 'Education Finance Expert',
                                    speakerBio: '15+ years experience in education financing',
                                    maxAttendees: 500,
                                    isFree: true,
                                    isFeatured: true,
                                },
                            }),
                            prisma.communityEvent.create({
                                data: {
                                    title: 'Visa Interview Preparation Workshop',
                                    description: 'Mock interviews and tips for acing your student visa interview. Interactive session with real visa officers.',
                                    type: 'workshop',
                                    category: 'Visa',
                                    date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
                                    time: '15:00',
                                    duration: 120,
                                    speaker: 'Sarah Johnson',
                                    speakerTitle: 'Former Visa Officer',
                                    maxAttendees: 100,
                                    isFree: false,
                                    price: 499,
                                    isFeatured: true,
                                },
                            }),
                            prisma.communityEvent.create({
                                data: {
                                    title: 'Study Abroad Q&A Session',
                                    description: 'Open Q&A session with current international students. Ask anything about studying abroad!',
                                    type: 'qa',
                                    category: 'General',
                                    date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
                                    time: '19:00',
                                    duration: 60,
                                    speaker: 'Student Panel',
                                    speakerTitle: 'Current International Students',
                                    maxAttendees: 200,
                                    isFree: true,
                                },
                            }),
                        ])];
                case 2:
                    events = _a.sent();
                    console.log("\u2705 Created ".concat(events.length, " events"));
                    return [4 /*yield*/, Promise.all([
                            prisma.successStory.create({
                                data: {
                                    name: 'Vikram Singh',
                                    email: 'vikram.singh@example.com',
                                    university: 'MIT',
                                    country: 'USA',
                                    degree: 'MS in Artificial Intelligence',
                                    loanAmount: '₹45,00,000',
                                    bank: 'HDFC Credila',
                                    interestRate: '9.25%',
                                    story: 'Coming from a middle-class family, studying at MIT was a dream. With the right guidance on education loans and scholarships, I secured 80% funding. The loan process was smooth with proper documentation. Now working at a top tech company, I\'ve already paid off 40% of my loan in 2 years!',
                                    tips: 'Start your loan application early, maintain good credit score, and explore scholarship opportunities alongside loans.',
                                    category: 'Engineering',
                                    isApproved: true,
                                    isFeatured: true,
                                },
                            }),
                            prisma.successStory.create({
                                data: {
                                    name: 'Neha Gupta',
                                    email: 'neha.gupta@example.com',
                                    university: 'Oxford University',
                                    country: 'UK',
                                    degree: 'MBA',
                                    loanAmount: '₹38,00,000',
                                    bank: 'Avanse',
                                    interestRate: '10.5%',
                                    story: 'Oxford MBA was expensive, but the ROI is incredible. I took an education loan covering full tuition and living expenses. The bank was supportive throughout. Post-MBA, I landed a consulting role with 3x salary increase. Loan repayment is on track!',
                                    tips: 'Choose programs with strong placement records. Calculate ROI before taking loans. Network actively during your program.',
                                    category: 'Business',
                                    isApproved: true,
                                    isFeatured: true,
                                },
                            }),
                            prisma.successStory.create({
                                data: {
                                    name: 'Arjun Reddy',
                                    email: 'arjun.reddy@example.com',
                                    university: 'University of Melbourne',
                                    country: 'Australia',
                                    degree: 'MS in Data Science',
                                    loanAmount: '₹32,00,000',
                                    bank: 'Auxilo',
                                    interestRate: '9.75%',
                                    story: 'Australia was my top choice for data science. The education loan covered everything - tuition, accommodation, and living costs. I worked part-time during my studies, which helped with expenses. Now a Data Scientist at a leading firm in Sydney!',
                                    tips: 'Look for countries with good work opportunities for students. Part-time work helps manage expenses and builds experience.',
                                    category: 'Data Science',
                                    isApproved: true,
                                    isFeatured: false,
                                },
                            }),
                        ])];
                case 3:
                    stories = _a.sent();
                    console.log("\u2705 Created ".concat(stories.length, " success stories"));
                    return [4 /*yield*/, Promise.all([
                            prisma.communityResource.create({
                                data: {
                                    title: 'Complete Education Loan Application Checklist',
                                    description: 'Step-by-step checklist for preparing your education loan application. Includes all required documents and timelines.',
                                    type: 'checklist',
                                    category: 'Loan Application',
                                    downloadUrl: '/resources/loan-checklist.pdf',
                                    thumbnailUrl: '/images/checklist-thumb.png',
                                    downloads: 1250,
                                    isFeatured: true,
                                },
                            }),
                            prisma.communityResource.create({
                                data: {
                                    title: 'SOP Writing Guide for Loan Applications',
                                    description: 'Comprehensive guide to writing a compelling Statement of Purpose for your loan application.',
                                    type: 'guide',
                                    category: 'Documentation',
                                    downloadUrl: '/resources/sop-guide.pdf',
                                    thumbnailUrl: '/images/sop-guide-thumb.png',
                                    downloads: 890,
                                    isFeatured: true,
                                },
                            }),
                            prisma.communityResource.create({
                                data: {
                                    title: 'Loan Comparison Spreadsheet Template',
                                    description: 'Excel template to compare different education loan offers. Calculate EMI, total interest, and choose the best option.',
                                    type: 'template',
                                    category: 'Finance',
                                    downloadUrl: '/resources/loan-comparison.xlsx',
                                    thumbnailUrl: '/images/spreadsheet-thumb.png',
                                    downloads: 2100,
                                    isFeatured: true,
                                },
                            }),
                            prisma.communityResource.create({
                                data: {
                                    title: 'Visa Interview Preparation Video Series',
                                    description: '5-part video series covering common visa interview questions and best practices.',
                                    type: 'video',
                                    category: 'Visa',
                                    fileUrl: '/resources/visa-prep-videos',
                                    thumbnailUrl: '/images/video-thumb.png',
                                    downloads: 1580,
                                    isFeatured: false,
                                },
                            }),
                        ])];
                case 4:
                    resources = _a.sent();
                    console.log("\u2705 Created ".concat(resources.length, " resources"));
                    console.log('✨ Community data seeding completed!');
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 5]);
                    return [4 /*yield*/, seedCommunity()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 2:
                    error_1 = _a.sent();
                    console.error('❌ Error seeding community data:', error_1);
                    throw error_1;
                case 3: return [4 /*yield*/, prisma.$disconnect()];
                case 4:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
main();

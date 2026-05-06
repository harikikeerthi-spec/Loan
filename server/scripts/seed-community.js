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
function seedCommunityData() {
    return __awaiter(this, void 0, void 0, function () {
        var mentors, events, stories, resources;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Seeding community data...');
                    // Seed Mentors
                    console.log('Creating mentors...');
                    return [4 /*yield*/, Promise.all([
                            prisma.mentor.create({
                                data: {
                                    name: 'Arjun Patel',
                                    email: 'arjun.patel@example.com',
                                    university: 'Harvard Business School',
                                    degree: 'MBA',
                                    country: 'USA',
                                    category: 'MBA',
                                    loanBank: 'HDFC',
                                    loanAmount: '₹75,00,000',
                                    loanType: 'Non-Collateral',
                                    interestRate: '8.5%',
                                    bio: 'Successfully secured a non-collateral education loan for Harvard MBA. Happy to guide students through the loan application process and share insights about studying in the US.',
                                    expertise: ['Non-Collateral', 'MBA', 'USA', 'HDFC'],
                                    rating: 4.9,
                                    studentsMentored: 47,
                                    isActive: true,
                                    isApproved: true,
                                    image: 'assets/img/avatar_1.png',
                                },
                            }),
                            prisma.mentor.create({
                                data: {
                                    name: 'Sneha Iyer',
                                    email: 'sneha.iyer@example.com',
                                    university: 'Stanford University',
                                    degree: 'MS Computer Science',
                                    country: 'USA',
                                    category: 'Computer Science',
                                    loanBank: 'SBI',
                                    loanAmount: '₹40,00,000',
                                    loanType: 'Scholar Loan',
                                    interestRate: '7.5%',
                                    bio: 'Got admitted to Stanford for MS CS and secured SBI Scholar Loan. I can help with top university applications, loan processes, and visa coordination.',
                                    expertise: ['Top Universities', 'Computer Science', 'SBI', 'USA'],
                                    rating: 5.0,
                                    studentsMentored: 68,
                                    isActive: true,
                                    isApproved: true,
                                    image: 'assets/img/avatar_2.png',
                                },
                            }),
                            prisma.mentor.create({
                                data: {
                                    name: 'Vikram Shah',
                                    email: 'vikram.shah@example.com',
                                    university: 'University of Cambridge',
                                    degree: 'Engineering',
                                    country: 'UK',
                                    category: 'Engineering',
                                    loanBank: 'ICICI',
                                    loanAmount: '₹55,00,000',
                                    interestRate: '8.2%',
                                    bio: 'Engineering graduate from Cambridge. Navigated the complex UK loan and visa process. Can help with UK universities and ICICI loan applications.',
                                    expertise: ['UK', 'Engineering', 'ICICI'],
                                    rating: 4.8,
                                    studentsMentored: 35,
                                    isActive: true,
                                    isApproved: true,
                                    image: 'assets/img/avatar_3.png',
                                },
                            }),
                            prisma.mentor.create({
                                data: {
                                    name: 'Meera Kapoor',
                                    email: 'meera.kapoor@example.com',
                                    university: 'University of Toronto',
                                    degree: 'Medicine',
                                    country: 'Canada',
                                    category: 'Medical',
                                    loanBank: 'Axis Bank',
                                    loanAmount: '₹60,00,000',
                                    interestRate: '8.0%',
                                    bio: 'Medical student at University of Toronto. Successfully secured Axis Bank education loan for medical programs in Canada.',
                                    expertise: ['Canada', 'Medical', 'Axis Bank'],
                                    rating: 4.9,
                                    studentsMentored: 38,
                                    isActive: true,
                                    isApproved: true,
                                    image: 'assets/img/avatar_1.png',
                                },
                            }),
                        ])];
                case 1:
                    mentors = _a.sent();
                    console.log("\u2705 Created ".concat(mentors.length, " mentors"));
                    // Seed Events
                    console.log('Creating events...');
                    return [4 /*yield*/, Promise.all([
                            prisma.communityEvent.create({
                                data: {
                                    title: 'How to Get SBI Education Loan Approved in 15 Days',
                                    description: 'Join Rajesh Kumar, former SBI loan officer, as he shares insider tips on fast-tracking your education loan application with proper documentation and strategies.',
                                    type: 'webinar',
                                    date: '2026-02-15',
                                    time: '6:00 PM - 7:30 PM IST',
                                    duration: 90,
                                    speaker: 'Rajesh Kumar',
                                    speakerTitle: 'Ex-SBI Loan Officer',
                                    maxAttendees: 500,
                                    attendeesCount: 420,
                                    isFree: true,
                                    isFeatured: true,
                                },
                            }),
                            prisma.communityEvent.create({
                                data: {
                                    title: 'Student Visa + Education Loan: Complete Guide',
                                    description: 'Immigration experts discuss how to coordinate loan disbursement with visa timelines for UK, USA, Canada, and Australia.',
                                    type: 'qa',
                                    date: '2026-02-18',
                                    time: '5:30 PM - 7:00 PM IST',
                                    duration: 90,
                                    speaker: 'Immigration Experts Panel',
                                    speakerTitle: 'Senior Consultants',
                                    maxAttendees: 300,
                                    attendeesCount: 285,
                                    isFree: true,
                                    isFeatured: false,
                                },
                            }),
                            prisma.communityEvent.create({
                                data: {
                                    title: 'Virtual Coffee Chat: Connect with Alumni',
                                    description: 'Casual networking session with students who have successfully repaid their loans. Ask questions, get advice, make connections.',
                                    type: 'networking',
                                    date: '2026-02-22',
                                    time: '11:00 AM - 12:00 PM IST',
                                    duration: 60,
                                    maxAttendees: 200,
                                    attendeesCount: 150,
                                    isFree: true,
                                    isFeatured: false,
                                },
                            }),
                            prisma.communityEvent.create({
                                data: {
                                    title: 'Collateral vs Non-Collateral Loans: What\'s Best for You?',
                                    description: 'Financial advisors break down the pros and cons of secured vs unsecured education loans, helping you make the right choice.',
                                    type: 'webinar',
                                    date: '2026-02-25',
                                    time: '7:00 PM - 8:30 PM IST',
                                    duration: 90,
                                    speaker: 'Financial Advisory Team',
                                    speakerTitle: 'Certified Advisors',
                                    maxAttendees: 500,
                                    attendeesCount: 520,
                                    isFree: true,
                                    isFeatured: false,
                                },
                            }),
                        ])];
                case 2:
                    events = _a.sent();
                    console.log("\u2705 Created ".concat(events.length, " events"));
                    // Seed Success Stories
                    console.log('Creating success stories...');
                    return [4 /*yield*/, Promise.all([
                            prisma.successStory.create({
                                data: {
                                    name: 'Rahul Verma',
                                    email: 'rahul.verma@example.com',
                                    university: 'University of Oxford',
                                    country: 'UK',
                                    degree: 'Master of Public Policy',
                                    category: 'Public Policy',
                                    loanAmount: '₹40,00,000',
                                    bank: 'HDFC Bank',
                                    interestRate: '7.5%',
                                    story: 'My journey to securing an education loan was challenging but rewarding. LoanHero\'s mentorship program connected me with an alumni who guided me to prepare all documents and negotiate better interest rates. Now pursuing my dream at Oxford!',
                                    tips: 'Start early, prepare all documents in advance, and don\'t hesitate to negotiate rates.',
                                    isApproved: true,
                                    isFeatured: true,
                                    image: 'assets/img/avatar_1.png',
                                },
                            }),
                            prisma.successStory.create({
                                data: {
                                    name: 'Priya Sharma',
                                    email: 'priya.sharma@example.com',
                                    university: 'MIT',
                                    country: 'USA',
                                    degree: 'MBA',
                                    category: 'MBA',
                                    loanAmount: '₹75,00,000',
                                    bank: 'ICICI Bank',
                                    interestRate: '8.2%',
                                    story: 'Getting into MIT was a dream come true, and ICICI made the financing possible. The process was smooth and I appreciated the transparent communication. I landed a great job and repaid the entire loan 2 years early with no prepayment penalties!',
                                    tips: 'Read the loan agreement carefully, especially prepayment clauses. Choose banks that offer flexibility.',
                                    isApproved: true,
                                    isFeatured: true,
                                    image: 'assets/img/avatar_2.png',
                                },
                            }),
                            prisma.successStory.create({
                                data: {
                                    name: 'Karan Singh',
                                    email: 'karan.singh@example.com',
                                    university: 'University of Melbourne',
                                    country: 'Australia',
                                    degree: 'Engineering',
                                    category: 'Engineering',
                                    loanAmount: '₹50,00,000',
                                    bank: 'SBI',
                                    interestRate: '7.8%',
                                    story: 'SBI\'s education loan for Australia was exactly what I needed. The interest moratorium during my study period was a huge relief. Now working in Melbourne and making regular EMI payments.',
                                    tips: 'Look for loans with moratorium periods. It gives you breathing space during studies.',
                                    isApproved: true,
                                    isFeatured: false,
                                    image: 'assets/img/avatar_3.png',
                                },
                            }),
                        ])];
                case 3:
                    stories = _a.sent();
                    console.log("\u2705 Created ".concat(stories.length, " success stories"));
                    // Seed Resources
                    console.log('Creating resources...');
                    return [4 /*yield*/, Promise.all([
                            prisma.communityResource.create({
                                data: {
                                    title: 'Complete Document Checklist for Education Loans',
                                    description: 'A comprehensive checklist of all documents required for education loan applications across major banks in India.',
                                    type: 'checklist',
                                    category: 'Documentation',
                                    downloads: 1250,
                                    isFeatured: true,
                                },
                            }),
                            prisma.communityResource.create({
                                data: {
                                    title: 'Education Loan Application Template',
                                    description: 'Ready-to-use application template with sample answers for common questions asked by banks.',
                                    type: 'template',
                                    category: 'Application',
                                    downloads: 890,
                                    isFeatured: true,
                                },
                            }),
                            prisma.communityResource.create({
                                data: {
                                    title: 'Step-by-Step Guide: Non-Collateral Loans',
                                    description: 'Detailed guide on securing non-collateral education loans, including eligibility criteria and bank comparisons.',
                                    type: 'guide',
                                    category: 'Loan Types',
                                    downloads: 1560,
                                    isFeatured: true,
                                },
                            }),
                            prisma.communityResource.create({
                                data: {
                                    title: 'EMI Calculator & Planning Guide',
                                    description: 'Interactive guide to understanding EMI calculations, repayment strategies, and budget planning.',
                                    type: 'guide',
                                    category: 'Repayment',
                                    downloads: 720,
                                    isFeatured: false,
                                },
                            }),
                        ])];
                case 4:
                    resources = _a.sent();
                    console.log("\u2705 Created ".concat(resources.length, " resources"));
                    console.log('✅ Community data seeding completed successfully!');
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
                    return [4 /*yield*/, seedCommunityData()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 2:
                    error_1 = _a.sent();
                    console.error('❌ Error seeding data:', error_1);
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
main()
    .catch(function (error) {
    console.error(error);
    process.exit(1);
});

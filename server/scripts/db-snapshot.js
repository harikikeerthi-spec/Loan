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
function dbSnapshot() {
    return __awaiter(this, void 0, void 0, function () {
        var users, loans, userDocs, appDocs, blogs, publishedBlogs, comments, tags, forumPosts, forumComments, mentors, bookings, events, registrations, stories, approvedStories, resources, referrals, universities, banks, countries, scholarships, loanTypes, courses, auditLogs, adminProfiles, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 27, 28, 30]);
                    console.log('\n========================================');
                    console.log('     📦 DATABASE SNAPSHOT');
                    console.log('========================================\n');
                    return [4 /*yield*/, prisma.user.findMany({
                            select: { id: true, email: true, firstName: true, lastName: true, role: true, mobile: true, createdAt: true, goal: true, studyDestination: true, admitStatus: true }
                        })];
                case 1:
                    users = _a.sent();
                    console.log("\uD83D\uDC65 USERS (".concat(users.length, " total):"));
                    users.forEach(function (u) {
                        var _a, _b, _c, _d, _e;
                        console.log("  - [".concat(u.role, "] ").concat(u.email, " | Name: ").concat((_a = u.firstName) !== null && _a !== void 0 ? _a : '-', " ").concat((_b = u.lastName) !== null && _b !== void 0 ? _b : '-', " | Mobile: ").concat(u.mobile, " | Goal: ").concat((_c = u.goal) !== null && _c !== void 0 ? _c : '-', " | Destination: ").concat((_d = u.studyDestination) !== null && _d !== void 0 ? _d : '-', " | Admit: ").concat((_e = u.admitStatus) !== null && _e !== void 0 ? _e : '-'));
                    });
                    return [4 /*yield*/, prisma.loanApplication.findMany({
                            select: { applicationNumber: true, userId: true, bank: true, loanType: true, amount: true, status: true, stage: true, date: true }
                        })];
                case 2:
                    loans = _a.sent();
                    console.log("\n\uD83D\uDCBC LOAN APPLICATIONS (".concat(loans.length, " total):"));
                    loans.forEach(function (l) {
                        var _a, _b;
                        console.log("  - [".concat(l.status, "] #").concat(l.applicationNumber.slice(0, 8), "... | Bank: ").concat(l.bank, " | Type: ").concat(l.loanType, " | Amount: Rs.").concat(l.amount, " | Stage: ").concat(l.stage, " | Date: ").concat((_b = (_a = l.date) === null || _a === void 0 ? void 0 : _a.toISOString().slice(0, 10)) !== null && _b !== void 0 ? _b : '-'));
                    });
                    return [4 /*yield*/, prisma.userDocument.findMany({
                            select: { userId: true, docType: true, status: true, uploaded: true, uploadedAt: true }
                        })];
                case 3:
                    userDocs = _a.sent();
                    console.log("\n\uD83D\uDCC4 USER DOCUMENTS (".concat(userDocs.length, " total):"));
                    userDocs.forEach(function (d) {
                        console.log("  - userId: ".concat(d.userId.slice(0, 8), "... | DocType: ").concat(d.docType, " | Uploaded: ").concat(d.uploaded, " | Status: ").concat(d.status));
                    });
                    return [4 /*yield*/, prisma.applicationDocument.findMany({
                            select: { applicationId: true, docType: true, docName: true, status: true, digilockerTxId: true }
                        })];
                case 4:
                    appDocs = _a.sent();
                    console.log("\n\uD83D\uDCCE APPLICATION DOCUMENTS (".concat(appDocs.length, " total):"));
                    appDocs.forEach(function (d) {
                        var _a;
                        console.log("  - appId: ".concat(d.applicationId.slice(0, 8), "... | ").concat(d.docType, ": ").concat(d.docName, " | Status: ").concat(d.status, " | DigiLocker: ").concat((_a = d.digilockerTxId) !== null && _a !== void 0 ? _a : 'N/A'));
                    });
                    return [4 /*yield*/, prisma.blog.count()];
                case 5:
                    blogs = _a.sent();
                    return [4 /*yield*/, prisma.blog.count({ where: { status: 'published' } })];
                case 6:
                    publishedBlogs = _a.sent();
                    console.log("\n\uD83D\uDCDD BLOGS: ".concat(blogs, " total | ").concat(publishedBlogs, " published"));
                    return [4 /*yield*/, prisma.comment.count()];
                case 7:
                    comments = _a.sent();
                    console.log("\uD83D\uDCAC COMMENTS: ".concat(comments, " total"));
                    return [4 /*yield*/, prisma.tag.findMany({ select: { name: true } })];
                case 8:
                    tags = _a.sent();
                    console.log("\uD83C\uDFF7\uFE0F  TAGS (".concat(tags.length, "): ").concat(tags.map(function (t) { return t.name; }).join(', ')));
                    return [4 /*yield*/, prisma.forumPost.count()];
                case 9:
                    forumPosts = _a.sent();
                    return [4 /*yield*/, prisma.forumComment.count()];
                case 10:
                    forumComments = _a.sent();
                    console.log("\n\uD83D\uDDE3\uFE0F  FORUM POSTS: ".concat(forumPosts, " | FORUM COMMENTS: ").concat(forumComments));
                    return [4 /*yield*/, prisma.mentor.findMany({
                            select: { name: true, university: true, country: true, isApproved: true, loanBank: true, loanAmount: true }
                        })];
                case 11:
                    mentors = _a.sent();
                    console.log("\n\uD83C\uDF93 MENTORS (".concat(mentors.length, " total):"));
                    mentors.forEach(function (m) {
                        console.log("  - ".concat(m.name, " | ").concat(m.university, ", ").concat(m.country, " | Bank: ").concat(m.loanBank, " | Loan: ").concat(m.loanAmount, " | Approved: ").concat(m.isApproved));
                    });
                    return [4 /*yield*/, prisma.mentorBooking.count()];
                case 12:
                    bookings = _a.sent();
                    console.log("\uD83D\uDCC5 MENTOR BOOKINGS: ".concat(bookings, " total"));
                    return [4 /*yield*/, prisma.communityEvent.count()];
                case 13:
                    events = _a.sent();
                    return [4 /*yield*/, prisma.eventRegistration.count()];
                case 14:
                    registrations = _a.sent();
                    console.log("\n\uD83C\uDFAA EVENTS: ".concat(events, " | REGISTRATIONS: ").concat(registrations));
                    return [4 /*yield*/, prisma.successStory.count()];
                case 15:
                    stories = _a.sent();
                    return [4 /*yield*/, prisma.successStory.count({ where: { isApproved: true } })];
                case 16:
                    approvedStories = _a.sent();
                    console.log("\uD83C\uDF1F SUCCESS STORIES: ".concat(stories, " total | ").concat(approvedStories, " approved"));
                    return [4 /*yield*/, prisma.communityResource.count()];
                case 17:
                    resources = _a.sent();
                    console.log("\uD83D\uDCDA COMMUNITY RESOURCES: ".concat(resources));
                    return [4 /*yield*/, prisma.referral.findMany({
                            select: { referrerId: true, refereeEmail: true, status: true }
                        })];
                case 18:
                    referrals = _a.sent();
                    console.log("\n\uD83D\uDD17 REFERRALS (".concat(referrals.length, " total):"));
                    referrals.forEach(function (r) {
                        var _a;
                        console.log("  - Referrer: ".concat(r.referrerId.slice(0, 8), "... | Referee: ").concat((_a = r.refereeEmail) !== null && _a !== void 0 ? _a : '-', " | Status: ").concat(r.status));
                    });
                    return [4 /*yield*/, prisma.university.count()];
                case 19:
                    universities = _a.sent();
                    return [4 /*yield*/, prisma.bank.count()];
                case 20:
                    banks = _a.sent();
                    return [4 /*yield*/, prisma.country.count()];
                case 21:
                    countries = _a.sent();
                    return [4 /*yield*/, prisma.scholarship.count()];
                case 22:
                    scholarships = _a.sent();
                    return [4 /*yield*/, prisma.loanType.count()];
                case 23:
                    loanTypes = _a.sent();
                    return [4 /*yield*/, prisma.course.count()];
                case 24:
                    courses = _a.sent();
                    console.log("\n\uD83D\uDCCA REFERENCE DATA:");
                    console.log("  - Universities: ".concat(universities));
                    console.log("  - Banks: ".concat(banks));
                    console.log("  - Countries: ".concat(countries));
                    console.log("  - Scholarships: ".concat(scholarships));
                    console.log("  - Loan Types: ".concat(loanTypes));
                    console.log("  - Courses: ".concat(courses));
                    return [4 /*yield*/, prisma.auditLog.count()];
                case 25:
                    auditLogs = _a.sent();
                    console.log("\n\uD83D\uDCCB AUDIT LOGS: ".concat(auditLogs, " entries"));
                    return [4 /*yield*/, prisma.adminProfile.count()];
                case 26:
                    adminProfiles = _a.sent();
                    console.log("\uD83D\uDEE1\uFE0F  ADMIN PROFILES: ".concat(adminProfiles));
                    console.log('\n========================================\n');
                    return [3 /*break*/, 30];
                case 27:
                    error_1 = _a.sent();
                    console.error('Error querying database:', error_1);
                    return [3 /*break*/, 30];
                case 28: return [4 /*yield*/, prisma.$disconnect()];
                case 29:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 30: return [2 /*return*/];
            }
        });
    });
}
dbSnapshot();

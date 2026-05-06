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
function seedForum() {
    return __awaiter(this, void 0, void 0, function () {
        var user, posts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Seeding forum data...');
                    return [4 /*yield*/, prisma.user.findFirst()];
                case 1:
                    user = _a.sent();
                    if (!!user) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: 'testuser@example.com',
                                password: 'password123',
                                mobile: '1234567890',
                                firstName: 'Test',
                                lastName: 'User',
                            },
                        })];
                case 2:
                    user = _a.sent();
                    _a.label = 3;
                case 3: 
                // Clean up existing forum data
                return [4 /*yield*/, prisma.forumComment.deleteMany()];
                case 4:
                    // Clean up existing forum data
                    _a.sent();
                    return [4 /*yield*/, prisma.forumPost.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            prisma.forumPost.create({
                                data: {
                                    authorId: user.id,
                                    title: 'How to choose between HDFC and SBI for education loans?',
                                    content: 'I have offers from both banks for my MS in US. HDFC is offering 9.5% non-collateral, while SBI is 8.25% with collateral. Which one should I go for?',
                                    category: 'Loans',
                                    tags: ['HDFC', 'SBI', 'Comparison'],
                                    views: 124,
                                    likes: 12,
                                },
                            }),
                            prisma.forumPost.create({
                                data: {
                                    authorId: user.id,
                                    title: 'Visa interview experience at Hyderabad Consulate',
                                    content: 'Just finished my F1 visa interview. It was quite smooth. They asked about my funding and why I chose this specific university. Total time inside was 2 hours.',
                                    category: 'Visa',
                                    tags: ['F1', 'Interview', 'Hyderabad'],
                                    views: 450,
                                    likes: 45,
                                },
                            }),
                            prisma.forumPost.create({
                                data: {
                                    authorId: user.id,
                                    title: 'Top universities for Data Science in Canada',
                                    content: 'I am looking for MS in Data Science programs in Canada for Fall 2026. So far I have shortlisted Toronto, UBC, and Waterloo. Any other suggestions?',
                                    category: 'Admissions',
                                    tags: ['Canada', 'Data Science', 'Admissions'],
                                    views: 230,
                                    likes: 18,
                                },
                            }),
                        ])];
                case 6:
                    posts = _a.sent();
                    // Add some comments
                    return [4 /*yield*/, prisma.forumComment.create({
                            data: {
                                postId: posts[0].id,
                                authorId: user.id,
                                content: 'If you have collateral, SBI is much better due to the lower interest rate over 10 years.',
                            },
                        })];
                case 7:
                    // Add some comments
                    _a.sent();
                    console.log("\u2705 Created ".concat(posts.length, " forum posts"));
                    console.log('✨ Forum data seeding completed!');
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
                    return [4 /*yield*/, seedForum()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 2:
                    error_1 = _a.sent();
                    console.error('❌ Error seeding forum data:', error_1);
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

"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SopAnalysisService = void 0;
var common_1 = require("@nestjs/common");
var SopAnalysisService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SopAnalysisService = _classThis = /** @class */ (function () {
        function SopAnalysisService_1(openRouterService) {
            this.openRouterService = openRouterService;
            this.logger = new common_1.Logger(SopAnalysisService.name);
        }
        SopAnalysisService_1.prototype.analyzeSop = function (text) {
            return __awaiter(this, void 0, void 0, function () {
                var safeText, systemPrompt, userPrompt, jsonResponse, cleanJson, result, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            safeText = text || '';
                            if (safeText.trim().length < 50) {
                                return [2 /*return*/, {
                                        totalScore: 0,
                                        quality: 'needs-work',
                                        categories: [],
                                        weakAreas: [
                                            {
                                                issue: 'Text too short',
                                                recommendation: 'Provide at least 50 words for accurate analysis',
                                            },
                                        ],
                                        summary: 'Your SOP is too short. Please provide at least 50 words for comprehensive analysis.',
                                    }];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            systemPrompt = "You are an expert admissions counselor and SOP evaluator. \n      Analyze the provided Statement of Purpose (SOP) text rigorously.\n      Return the response in strict JSON format matching the following structure:\n      {\n        \"totalScore\": number (0-100),\n        \"quality\": \"excellent\" | \"good\" | \"fair\" | \"needs-work\",\n        \"categories\": [\n          { \"name\": \"Clarity\", \"score\": number (0-20), \"weight\": 0.15 },\n          { \"name\": \"Financial Justification\", \"score\": number (0-25), \"weight\": 0.25 },\n          { \"name\": \"Career ROI\", \"score\": number (0-25), \"weight\": 0.25 },\n          { \"name\": \"Originality\", \"score\": number (0-20), \"weight\": 0.20 },\n          { \"name\": \"Post-Study Income Clarity\", \"score\": number (0-10), \"weight\": 0.15 }\n        ],\n        \"weakAreas\": [\n          { \"issue\": \"string\", \"recommendation\": \"string\" }\n        ],\n        \"summary\": \"string\"\n      }\n      If the SOP talks about loans or financial needs, give credit in \"Financial Justification\".\n      Ensure strict valid JSON output only. No markdown formatting.";
                            userPrompt = "Here is the SOP to analyze:\n\n\"".concat(safeText, "\"");
                            return [4 /*yield*/, this.openRouterService.generateResponse(systemPrompt, userPrompt)];
                        case 2:
                            jsonResponse = _a.sent();
                            cleanJson = jsonResponse
                                .replace(/```json/g, '')
                                .replace(/```/g, '')
                                .trim();
                            result = JSON.parse(cleanJson);
                            return [2 /*return*/, result];
                        case 3:
                            error_1 = _a.sent();
                            this.logger.error('SOP Analysis with LLM failed, falling back to heuristic analysis', error_1);
                            return [2 /*return*/, this.fallbackAnalyzeSop(safeText)];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        // Fallback to the old logic if LLM fails
        SopAnalysisService_1.prototype.fallbackAnalyzeSop = function (text) {
            var clarity = this.analyzeSopClarity(text);
            var financial = this.analyzeFinancialJustification(text);
            var careerROI = this.analyzeCareerROI(text);
            var originality = this.analyzeOriginality(text);
            var postIncome = this.analyzePostStudyIncome(text);
            var categories = [
                {
                    name: 'Clarity',
                    score: Math.max(0, Math.min(20, clarity.score)),
                    weight: 0.15,
                },
                {
                    name: 'Financial Justification',
                    score: Math.max(0, Math.min(25, financial.score)),
                    weight: 0.25,
                },
                {
                    name: 'Career ROI',
                    score: Math.max(0, Math.min(25, careerROI.score)),
                    weight: 0.25,
                },
                {
                    name: 'Originality',
                    score: Math.max(0, Math.min(20, originality.score)),
                    weight: 0.2,
                },
                {
                    name: 'Post-Study Income Clarity',
                    score: Math.max(0, Math.min(10, postIncome.score)),
                    weight: 0.15,
                },
            ];
            var totalScore = categories.reduce(function (sum, cat) { return sum + cat.score * cat.weight; }, 0);
            var allFeedback = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], clarity.feedback, true), financial.feedback, true), careerROI.feedback, true), originality.feedback, true), postIncome.feedback, true);
            var quality = 'needs-work';
            if (totalScore >= 80)
                quality = 'excellent';
            else if (totalScore >= 65)
                quality = 'good';
            else if (totalScore >= 50)
                quality = 'fair';
            var summary = this.generateSummary(totalScore);
            return {
                totalScore: totalScore,
                quality: quality,
                categories: categories,
                weakAreas: allFeedback,
                summary: summary,
            };
        };
        // ... (Keeping private helper methods from original file for fallback)
        SopAnalysisService_1.prototype.analyzeSopClarity = function (text) {
            var score = 0;
            var feedback = [];
            var sentences = text.split(/[.!?]+/).filter(function (s) { return s.trim().length > 0; });
            var avgSentenceLength = text.split(/\s+/).length / Math.max(1, sentences.length);
            if (avgSentenceLength > 25) {
                score += 10;
                feedback.push({
                    issue: 'Clarity is compromised',
                    recommendation: "Simplify long sentences (avg: ${avgSentenceLength.toFixed(1)} words)",
                });
            }
            else if (avgSentenceLength > 20) {
                score += 15;
            }
            else {
                score += 20;
            }
            var complexWords = (text.match(/\b(?:notwithstanding|aforementioned|heretofore|thereof|herewith)\b/gi) || []).length;
            if (complexWords > 0) {
                feedback.push({
                    issue: 'Excessive jargon detected',
                    recommendation: 'Simplify technical language for better clarity',
                });
            }
            else {
                score += 5;
            }
            return { score: score, feedback: feedback };
        };
        SopAnalysisService_1.prototype.analyzeFinancialJustification = function (text) {
            var score = 0;
            var feedback = [];
            var lowerText = text.toLowerCase();
            var financialKeywords = [
                'investment',
                'return',
                'cost',
                'scholarship',
                'tuition',
                'expense',
                'funding',
                'afford',
                'loan',
                'financial',
            ];
            var keywordMatches = financialKeywords.filter(function (k) {
                return lowerText.includes(k);
            }).length;
            if (keywordMatches >= 6) {
                score += 25;
            }
            else if (keywordMatches >= 4) {
                score += 18;
            }
            else if (keywordMatches >= 2) {
                score += 10;
                feedback.push({
                    issue: 'Limited financial justification',
                    recommendation: "Explain how the loan serves your goals and why it's a sound investment",
                });
            }
            else {
                feedback.push({
                    issue: 'No financial justification found',
                    recommendation: "Address how you'll manage costs and repay the loan",
                });
            }
            if (lowerText.includes('family') ||
                lowerText.includes('background') ||
                lowerText.includes('support')) {
                score += 5;
            }
            return { score: score, feedback: feedback };
        };
        SopAnalysisService_1.prototype.analyzeCareerROI = function (text) {
            var score = 0;
            var feedback = [];
            var lowerText = text.toLowerCase();
            var careerKeywords = [
                'career',
                'goal',
                'aspiration',
                'profession',
                'industry',
                'role',
                'position',
                'company',
                'opportunity',
            ];
            var careerMatches = careerKeywords.filter(function (k) {
                return lowerText.includes(k);
            }).length;
            if (careerMatches >= 7) {
                score += 25;
            }
            else if (careerMatches >= 5) {
                score += 18;
            }
            else if (careerMatches >= 3) {
                score += 10;
                feedback.push({
                    issue: 'Career ROI unclear',
                    recommendation: 'Clearly articulate your post-study career goals and how this education enables them',
                });
            }
            else {
                feedback.push({
                    issue: 'Missing career trajectory',
                    recommendation: 'Explain specific roles and industries you aim to work in after graduation',
                });
            }
            if (lowerText.includes('salary') ||
                lowerText.includes('income') ||
                lowerText.includes('earning')) {
                score += 5;
            }
            if (lowerText.includes('skill') ||
                lowerText.includes('competence') ||
                lowerText.includes('expertise')) {
                score += 5;
            }
            return { score: score, feedback: feedback };
        };
        SopAnalysisService_1.prototype.analyzeOriginality = function (text) {
            var score = 0;
            var feedback = [];
            var lowerText = text.toLowerCase();
            var firstPersonCount = (text.match(/\bI\b|my|me\b/gi) || []).length;
            if (firstPersonCount > 30) {
                score += 15;
            }
            else if (firstPersonCount > 15) {
                score += 10;
            }
            else {
                score += 5;
                feedback.push({
                    issue: 'Lacks personal voice',
                    recommendation: 'Share specific personal experiences and motivations, not generic statements',
                });
            }
            var clicheKeywords = [
                'unique opportunity',
                'passion for learning',
                'make a difference',
                'change the world',
                'leverage my skills',
            ];
            var clicheCount = clicheKeywords.filter(function (c) {
                return lowerText.includes(c.toLowerCase());
            }).length;
            if (clicheCount > 3) {
                feedback.push({
                    issue: 'Common clichés detected',
                    recommendation: 'Replace overused phrases with specific, personal examples',
                });
            }
            else {
                score += 10;
            }
            var hasNumbers = /\d+(?:%|year|degree|gpa|score)?/i.test(text);
            var hasSpecificNames = /(?:company|university|project|course|field):\s*[A-Z]/i.test(text);
            if (hasNumbers && hasSpecificNames) {
                score += 10;
            }
            else if (hasNumbers || hasSpecificNames) {
                score += 5;
            }
            return { score: score, feedback: feedback };
        };
        SopAnalysisService_1.prototype.analyzePostStudyIncome = function (text) {
            var score = 0;
            var feedback = [];
            var lowerText = text.toLowerCase();
            var postStudyKeywords = [
                'after graduation',
                'upon completion',
                'post-study',
                'following degree',
                'after course',
            ];
            var postStudyMentioned = postStudyKeywords.some(function (k) {
                return lowerText.includes(k);
            });
            if (!postStudyMentioned) {
                feedback.push({
                    issue: 'Post-study income clarity weak',
                    recommendation: "Specify expected income/salary after graduation and how you'll repay the loan",
                });
            }
            else {
                score += 15;
            }
            if (lowerText.includes('salary') ||
                lowerText.includes('income') ||
                lowerText.includes('earn')) {
                score += 15;
            }
            else {
                score += 5;
            }
            return { score: score, feedback: feedback };
        };
        SopAnalysisService_1.prototype.generateSummary = function (score) {
            if (score >= 80) {
                return '🎯 Your SOP is compelling for loan approval. Strong financial justification, clear career goals, and personal voice make this application-ready.';
            }
            else if (score >= 65) {
                return '✅ Good SOP with solid structure. Focus on strengthening career ROI clarity and post-study income expectations to boost approval chances.';
            }
            else if (score >= 50) {
                return '⚠️ Your SOP needs revision. Prioritize adding specific financial justification and career trajectory to improve loan approval prospects.';
            }
            else {
                return '🔧 Significant improvements needed. Rewrite focusing on: (1) Financial necessity, (2) Career goals, (3) Personal motivation.';
            }
        };
        return SopAnalysisService_1;
    }());
    __setFunctionName(_classThis, "SopAnalysisService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SopAnalysisService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SopAnalysisService = _classThis;
}();
exports.SopAnalysisService = SopAnalysisService;

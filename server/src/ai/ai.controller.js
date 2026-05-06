"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
var common_1 = require("@nestjs/common");
var AiController = function () {
    var _classDecorators = [(0, common_1.Controller)('ai')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _checkEligibility_decorators;
    var _analyzeSop_decorators;
    var _convertGrades_decorators;
    var _analyzeGrades_decorators;
    var _compareGrades_decorators;
    var _compareUniversities_decorators;
    var _predictAdmission_decorators;
    var _chat_decorators;
    var AiController = _classThis = /** @class */ (function () {
        function AiController_1(eligibilityService, loanRecommendationService, sopAnalysisService, gradeConversionService, universityComparisonService, admitPredictorService, aiSupportService) {
            this.eligibilityService = (__runInitializers(this, _instanceExtraInitializers), eligibilityService);
            this.loanRecommendationService = loanRecommendationService;
            this.sopAnalysisService = sopAnalysisService;
            this.gradeConversionService = gradeConversionService;
            this.universityComparisonService = universityComparisonService;
            this.admitPredictorService = admitPredictorService;
            this.aiSupportService = aiSupportService;
        }
        AiController_1.prototype.checkEligibility = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var eligibilityResult, loanRecommendations;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.eligibilityService.calculateEligibilityScore(data)];
                        case 1:
                            eligibilityResult = _a.sent();
                            loanRecommendations = this.loanRecommendationService.recommendLoans(eligibilityResult.score, data.credit, eligibilityResult.ratio, data.loan, data.coApplicant, data.collateral, data.study);
                            return [2 /*return*/, {
                                    success: true,
                                    eligibility: eligibilityResult,
                                    recommendations: loanRecommendations,
                                }];
                    }
                });
            });
        };
        AiController_1.prototype.analyzeSop = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var result, error_1;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            console.log('Analyzing SOP:', ((_a = data.sop) === null || _a === void 0 ? void 0 : _a.substring(0, 50)) + '...');
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.sopAnalysisService.analyzeSop(data.sop)];
                        case 2:
                            result = _b.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    analysis: result,
                                }];
                        case 3:
                            error_1 = _b.sent();
                            console.error('SOP Analysis Error:', error_1);
                            throw error_1;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        AiController_1.prototype.convertGrades = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.gradeConversionService.convertGrade(data)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    gradeConversion: result,
                                }];
                    }
                });
            });
        };
        AiController_1.prototype.analyzeGrades = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var result, analysisData;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.gradeConversionService.convertGrade({
                                inputType: data.percentage ? 'percentage' : 'marks',
                                inputValue: data.percentage || ((_a = data.marks) === null || _a === void 0 ? void 0 : _a.reduce(function (a, b) { return a + b; }, 0)) || 0,
                                totalMarks: data.totalMarks || 100,
                                outputType: 'percentage',
                                // gradingSystem: 'Standard', // Default (Removed to fix type error)
                            })];
                        case 1:
                            result = _b.sent();
                            analysisData = {
                                percentage: result.percentage,
                                letterGrade: result.letterGrade,
                                classification: result.classification,
                                internationalEquivalent: result.internationalEquivalent,
                                analysis: result.analysis,
                                // Pass through marks breakdown if available
                                marksBreakdown: data.subjects
                                    ? data.subjects.map(function (subject, index) {
                                        var _a, _b;
                                        return ({
                                            subject: subject,
                                            marks: ((_a = data.marks) === null || _a === void 0 ? void 0 : _a[index]) || 0,
                                            outOf: (data.totalMarks || 100) / (((_b = data.marks) === null || _b === void 0 ? void 0 : _b.length) || 1),
                                        });
                                    })
                                    : null,
                            };
                            return [2 /*return*/, {
                                    success: true,
                                    gradeAnalysis: analysisData,
                                }];
                    }
                });
            });
        };
        AiController_1.prototype.compareGrades = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.gradeConversionService.comparePerformance(data.assessments)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    comparison: result,
                                }];
                    }
                });
            });
        };
        AiController_1.prototype.compareUniversities = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.universityComparisonService.compare(data.uni1, data.uni2)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: result,
                                }];
                    }
                });
            });
        };
        AiController_1.prototype.predictAdmission = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.admitPredictorService.predict(data)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    prediction: result,
                                }];
                    }
                });
            });
        };
        AiController_1.prototype.chat = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.aiSupportService.getResponse(data.message)];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: response,
                                }];
                    }
                });
            });
        };
        return AiController_1;
    }());
    __setFunctionName(_classThis, "AiController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _checkEligibility_decorators = [(0, common_1.Post)('eligibility-check')];
        _analyzeSop_decorators = [(0, common_1.Post)('sop-analysis')];
        _convertGrades_decorators = [(0, common_1.Post)('convert-grades')];
        _analyzeGrades_decorators = [(0, common_1.Post)('analyze-grades')];
        _compareGrades_decorators = [(0, common_1.Post)('compare-grades')];
        _compareUniversities_decorators = [(0, common_1.Post)('compare-universities')];
        _predictAdmission_decorators = [(0, common_1.Post)('predict-admission')];
        _chat_decorators = [(0, common_1.Post)('support-chat')];
        __esDecorate(_classThis, null, _checkEligibility_decorators, { kind: "method", name: "checkEligibility", static: false, private: false, access: { has: function (obj) { return "checkEligibility" in obj; }, get: function (obj) { return obj.checkEligibility; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _analyzeSop_decorators, { kind: "method", name: "analyzeSop", static: false, private: false, access: { has: function (obj) { return "analyzeSop" in obj; }, get: function (obj) { return obj.analyzeSop; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _convertGrades_decorators, { kind: "method", name: "convertGrades", static: false, private: false, access: { has: function (obj) { return "convertGrades" in obj; }, get: function (obj) { return obj.convertGrades; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _analyzeGrades_decorators, { kind: "method", name: "analyzeGrades", static: false, private: false, access: { has: function (obj) { return "analyzeGrades" in obj; }, get: function (obj) { return obj.analyzeGrades; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _compareGrades_decorators, { kind: "method", name: "compareGrades", static: false, private: false, access: { has: function (obj) { return "compareGrades" in obj; }, get: function (obj) { return obj.compareGrades; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _compareUniversities_decorators, { kind: "method", name: "compareUniversities", static: false, private: false, access: { has: function (obj) { return "compareUniversities" in obj; }, get: function (obj) { return obj.compareUniversities; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _predictAdmission_decorators, { kind: "method", name: "predictAdmission", static: false, private: false, access: { has: function (obj) { return "predictAdmission" in obj; }, get: function (obj) { return obj.predictAdmission; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _chat_decorators, { kind: "method", name: "chat", static: false, private: false, access: { has: function (obj) { return "chat" in obj; }, get: function (obj) { return obj.chat; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AiController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AiController = _classThis;
}();
exports.AiController = AiController;

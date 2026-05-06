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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmitPredictorService = void 0;
var common_1 = require("@nestjs/common");
var AdmitPredictorService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AdmitPredictorService = _classThis = /** @class */ (function () {
        function AdmitPredictorService_1(openRouterService) {
            this.openRouterService = openRouterService;
            this.logger = new common_1.Logger(AdmitPredictorService.name);
        }
        AdmitPredictorService_1.prototype.predict = function (profile) {
            return __awaiter(this, void 0, void 0, function () {
                var systemPrompt, userPrompt, jsonResponse, jsonMatch, cleanJson, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Validate Inputs
                            if (profile.gpa < 0 || profile.gpa > profile.gpaScale) {
                                throw new common_1.BadRequestException("GPA must be between 0 and ".concat(profile.gpaScale));
                            }
                            if (profile.testScoreType === 'GRE' &&
                                (profile.testScore < 260 || profile.testScore > 340)) {
                                throw new common_1.BadRequestException('GRE score must be between 260 and 340');
                            }
                            if (profile.testScoreType === 'GMAT' &&
                                (profile.testScore < 200 || profile.testScore > 800)) {
                                throw new common_1.BadRequestException('GMAT score must be between 200 and 800');
                            }
                            if (profile.testScoreType === 'SAT' &&
                                (profile.testScore < 400 || profile.testScore > 1600)) {
                                throw new common_1.BadRequestException('SAT score must be between 400 and 1600');
                            }
                            if (profile.englishTestType === 'IELTS' &&
                                (profile.englishTestScore < 0 || profile.englishTestScore > 9)) {
                                throw new common_1.BadRequestException('IELTS score must be between 0 and 9');
                            }
                            if (profile.englishTestType === 'TOEFL' &&
                                (profile.englishTestScore < 0 || profile.englishTestScore > 120)) {
                                throw new common_1.BadRequestException('TOEFL score must be between 0 and 120');
                            }
                            if (profile.englishTestType === 'PTE' &&
                                (profile.englishTestScore < 10 || profile.englishTestScore > 90)) {
                                throw new common_1.BadRequestException('PTE score must be between 10 and 90');
                            }
                            if (profile.englishTestType === 'Duolingo' &&
                                (profile.englishTestScore < 10 || profile.englishTestScore > 160)) {
                                throw new common_1.BadRequestException('Duolingo score must be between 10 and 160');
                            }
                            if (profile.englishTestType === 'MOI') {
                                if (profile.moiIntermediateMarks === undefined ||
                                    profile.moiIntermediateMarks < 0 ||
                                    profile.moiIntermediateMarks > 200) {
                                    throw new common_1.BadRequestException('Intermediate English marks must be between 0 and 200');
                                }
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            systemPrompt = "You are an expert university admissions counselor. \n            Evaluate the student's chances of admission to the target university based on their profile.\n            Return the response in strict JSON format matching the following structure:\n            {\n                \"university\": \"Target University Name\",\n                \"probability\": number (0-100),\n                \"tier\": 1 | 2 | 3 (1=Top/Ivy, 2=Good/Mid, 3=Safe),\n                \"feedback\": [\"string\", \"string\"] // List of specific feedback/suggestions\n            }\n            CRITICAL: If 'moiInstitution' is provided, you MUST verify if it is a legitimate, real educational institution in India.\n            - If the institution name appears to be fake, gibberish, or clearly invalid (e.g. \"Abc College\", \"Fake Info\", random characters), set \"probability\" to 0 and add \"Invalid Institution Name\" to feedback.\n            - Be strict about this. Only accept plausible real institution names.\n            Be realistic with admission chances. Top universities (Harvard, MIT, etc.) should rarely have high probabilities (>30%) unless the profile is exceptional.\n            Ensure strict valid JSON output only. No markdown formatting.";
                            userPrompt = "Profile:\n            Target University: ".concat(profile.targetUniversity, "\n            Program Level: ").concat(profile.programLevel, "\n            GPA: ").concat(profile.gpa, " (Scale: ").concat(profile.gpaScale, ")\n            Test Score: ").concat(profile.testScoreType, " - ").concat(profile.testScore, "\n            English Test: ").concat(profile.englishTestType, " - ").concat(profile.englishTestScore, "\n            Experience: ").concat(profile.experienceYears, " years\n            Research Papers: ").concat(profile.researchPapers);
                            if (profile.englishTestType === 'MOI') {
                                userPrompt += "\n                MOI Details:\n                - Intermediate/12th Grade English Marks: ".concat(profile.moiIntermediateMarks || 'Not provided', "\n                - Previous Institution: ").concat(profile.moiInstitution || 'Not provided');
                            }
                            return [4 /*yield*/, this.openRouterService.generateResponse(systemPrompt, userPrompt)];
                        case 2:
                            jsonResponse = _a.sent();
                            jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
                            cleanJson = jsonMatch ? jsonMatch[0] : jsonResponse;
                            return [2 /*return*/, JSON.parse(cleanJson)];
                        case 3:
                            error_1 = _a.sent();
                            this.logger.error('Admit prediction failed', error_1);
                            // Fallback
                            return [2 /*return*/, {
                                    university: profile.targetUniversity,
                                    probability: 50,
                                    tier: 2,
                                    feedback: ['AI Analysis failed. Please try again later.'],
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return AdmitPredictorService_1;
    }());
    __setFunctionName(_classThis, "AdmitPredictorService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdmitPredictorService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdmitPredictorService = _classThis;
}();
exports.AdmitPredictorService = AdmitPredictorService;

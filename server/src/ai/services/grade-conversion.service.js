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
exports.GradeConversionService = void 0;
var common_1 = require("@nestjs/common");
var GradeConversionService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var GradeConversionService = _classThis = /** @class */ (function () {
        function GradeConversionService_1(openRouterService) {
            this.openRouterService = openRouterService;
            this.logger = new common_1.Logger(GradeConversionService.name);
        }
        GradeConversionService_1.prototype.convertGrade = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                var val, val, val, val, systemPrompt, userPrompt, jsonResponse, jsonMatch, cleanJson;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Validate Input
                            if (input.inputType === 'percentage') {
                                val = Number(input.inputValue);
                                if (isNaN(val) || val < 0 || val > 100) {
                                    throw new common_1.BadRequestException('Percentage must be between 0 and 100');
                                }
                            }
                            else if (input.inputType === 'gpa') {
                                val = Number(input.inputValue);
                                if (isNaN(val) || val < 0 || val > 4.0) {
                                    throw new common_1.BadRequestException('GPA must be between 0 and 4.0');
                                }
                            }
                            else if (input.inputType === 'cgpa') {
                                val = Number(input.inputValue);
                                if (isNaN(val) || val < 0 || val > 10.0) {
                                    throw new common_1.BadRequestException('CGPA must be between 0 and 10.0');
                                }
                            }
                            else if (input.inputType === 'marks') {
                                val = Number(input.inputValue);
                                if (input.totalMarks &&
                                    (isNaN(val) || val < 0 || val > input.totalMarks)) {
                                    throw new common_1.BadRequestException('Marks cannot exceed Total Marks');
                                }
                            }
                            systemPrompt = "You are an expert academic transcript evaluator. \n         Convert the provided grade and provide a brief analysis.\n         Ensure strict adherence to the provided 'Input Type'.\n         - If Input Type is 'percentage', the value (e.g., 8.5) is out of 100. Do NOT assume it is CGPA (out of 10). 8.5% is a failing grade.\n         - If Input Type is 'letterGrade', the value MUST be a string (e.g., A, B+). If a number is provided, return an error in the analysis.\n         - SPECIAL RULE: If the Letter Grade is 'O' (Outstanding), treat it as 100% (Perfect Score).\n         - SPECIAL RULE: The '+' suffix is ONLY valid for grades 'A' and 'B' (e.g., A+, B+). If a user provides C+, D+, etc., return an error saying \"Only A and B grades can have a +\".\n         - SPECIAL RULE: If the grade has a '+' (e.g., A+), it MUST have a higher percentage than the base grade (e.g., A+ > A).\n         - Guideline: A+ should be ~97-99%, A should be ~93-96%.\n         - Conversion Guidelines:\n            - CGPA (out of 10) must be exactly Percentage / 10. (e.g., 65% -> 6.5).\n            - US GPA (out of 4.0): Use a granulary linear scale. \n              - 65% (D grade) should map to approx 1.4 US GPA.\n              - 50% (E grade) should map to approx 1.0 US GPA.\n              - 40% (Pass) should map to approx 0.7 US GPA.\n              - 100% (O grade) is 4.0.\n              - 0% is 0.0.\n         - If Input Type is 'cgpa', the value is out of 10.\n         - If Input Type is 'gpa', the value is out of 4.0.\n         \n         Return the response in strict JSON format matching the following structure:\n         {\n             \"inputGrade\": \"string\",\n             \"outputGrade\": \"string\",\n             \"percentage\": number,\n             \"gpa\": number (4.0 scale),\n             \"cgpa\": number (10.0 scale),\n             \"letterGrade\": \"string\",\n             \"classification\": \"string\",\n             \"internationalEquivalent\": {\n                 \"US\": \"string\",\n                 \"UK\": \"string\",\n                 \"India\": \"string\"\n             },\n             \"analysis\": {\n                 \"strength\": \"string\",\n                 \"competitiveness\": \"string\",\n                 \"recommendations\": [\"string\", \"string\"]\n             }\n         }\n         Ensure strict valid JSON output only. No markdown formatting.";
                            userPrompt = "Convert Grade:\n         Input: ".concat(input.inputValue, " (Type: ").concat(input.inputType, ")\n         System: ").concat(input.gradingSystem || 'Standard', "\n         Target Output: ").concat(input.outputType, "\n         Total Marks (if applicable): ").concat(input.totalMarks);
                            return [4 /*yield*/, this.openRouterService.generateResponse(systemPrompt, userPrompt, 0.0)];
                        case 1:
                            jsonResponse = _a.sent();
                            jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
                            cleanJson = jsonMatch ? jsonMatch[0] : jsonResponse;
                            return [2 /*return*/, JSON.parse(cleanJson)];
                    }
                });
            });
        };
        GradeConversionService_1.prototype.comparePerformance = function (assessments) {
            return __awaiter(this, void 0, void 0, function () {
                var _i, assessments_1, assessment, systemPrompt, userPrompt, jsonResponse, jsonMatch, cleanJson;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Validate assessments
                            for (_i = 0, assessments_1 = assessments; _i < assessments_1.length; _i++) {
                                assessment = assessments_1[_i];
                                if (assessment.percentage < 0 || assessment.percentage > 100) {
                                    throw new common_1.BadRequestException("Percentage for ".concat(assessment.name, " must be between 0 and 100"));
                                }
                            }
                            systemPrompt = "Analyze the student's academic performance trend based on the provided assessments.\n          Return the response in strict JSON format:\n          {\n             \"trend\": \"string (e.g. Improving, Declining)\",\n             \"averagePerformance\": number,\n             \"bestPerformance\": \"string\",\n             \"worstPerformance\": \"string\",\n             \"progression\": \"string\"\n          }";
                            userPrompt = "Assessments: ".concat(JSON.stringify(assessments));
                            return [4 /*yield*/, this.openRouterService.generateResponse(systemPrompt, userPrompt)];
                        case 1:
                            jsonResponse = _a.sent();
                            jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
                            cleanJson = jsonMatch ? jsonMatch[0] : jsonResponse;
                            return [2 /*return*/, JSON.parse(cleanJson)];
                    }
                });
            });
        };
        return GradeConversionService_1;
    }());
    __setFunctionName(_classThis, "GradeConversionService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GradeConversionService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GradeConversionService = _classThis;
}();
exports.GradeConversionService = GradeConversionService;

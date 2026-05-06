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
exports.UniversityComparisonService = void 0;
var common_1 = require("@nestjs/common");
var UniversityComparisonService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var UniversityComparisonService = _classThis = /** @class */ (function () {
        function UniversityComparisonService_1(openRouterService) {
            this.openRouterService = openRouterService;
            this.logger = new common_1.Logger(UniversityComparisonService.name);
        }
        UniversityComparisonService_1.prototype.compare = function (uni1, uni2) {
            return __awaiter(this, void 0, void 0, function () {
                var systemPrompt, userPrompt, jsonResponse, jsonMatch, cleanJson, parsed, normalize, u1Raw, u2Raw, error_1;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _e.trys.push([0, 2, , 3]);
                            systemPrompt = "You are an expert educational consultant. \n            Compare the two universities provided. \n            Return the response in strict JSON format as an array of two objects:\n            [\n                {\n                    \"name\": \"University Name\",\n                    \"rank\": \"Global Rank\",\n                    \"tuition\": \"Annual Tuition (in local currency, e.g., \u00A315,000)\",\n                    \"rate\": \"Acceptance Rate\",\n                    \"salary\": \"Avg Graduate Salary (in local currency)\",\n                    \"loc\": \"City, Country\"\n                },\n                {\n                    \"name\": \"University Name\",\n                    \"rank\": \"Global Rank\",\n                    \"tuition\": \"Annual Tuition (in local currency, e.g., $20,000)\",\n                    \"rate\": \"Acceptance Rate\",\n                    \"salary\": \"Avg Graduate Salary (in local currency)\",\n                    \"loc\": \"City, Country\"\n                }\n            ]\n            Provide realistic, up-to-date estimates.\n            CRITICAL: Verify if the university is a real institution.\n            - Be smart about names (e.g., \"University of Law\" -> \"The University of Law, UK\").\n            - Only return \"Not Available\" if the name is completely fictional (like \"Hogwarts\") or gibberish.\n            - If a university exists but data is limited, provide best estimates.\n            - If a university does not exist, return strict JSON object with \"name\": \"Not Available\".\n            \n            Ensure strict valid JSON output only. No markdown formatting.\n            CRITICAL: Verify if the university is a real institution.\n            - Be smart about names (e.g., \"University of Law\" -> \"The University of Law, UK\").\n            - For specialized or multi-campus institutions without a single global QS/THE rank (like \"The University of Law\"), return \"Specialized\" or \"N/A\" for the rank. DO NOT GUESS a number.\n            - Only return \"Not Available\" if the name is completely fictional (like \"Hogwarts\") or gibberish.\n            - If a university exists but data is limited, provide best estimates.\n            - If a university does not exist, return strict JSON object with \"name\": \"Not Available\".";
                            userPrompt = "Compare ".concat(uni1, " and ").concat(uni2);
                            return [4 /*yield*/, this.openRouterService.generateResponse(systemPrompt, userPrompt, 0.1)];
                        case 1:
                            jsonResponse = _e.sent();
                            // Improved JSON extraction
                            console.log('DEBUG: Received response from LLM');
                            console.log('DEBUG: Raw LLM Output:', jsonResponse);
                            jsonMatch = jsonResponse.match(/(\{|\[)[\s\S]*(\}|\])/);
                            cleanJson = jsonMatch ? jsonMatch[0] : jsonResponse;
                            console.log('DEBUG: Cleaned JSON for parsing:', cleanJson);
                            parsed = JSON.parse(cleanJson);
                            console.log('DEBUG: Successfully parsed JSON');
                            normalize = function (obj) {
                                if (!obj)
                                    return {
                                        name: 'Unknown',
                                        rank: 'N/A',
                                        tuition: 'N/A',
                                        rate: 'N/A',
                                        salary: 'N/A',
                                        loc: 'Unknown',
                                    };
                                var get = function (k) {
                                    return obj[k] ||
                                        obj[k.toLowerCase()] ||
                                        obj[k.charAt(0).toUpperCase() + k.slice(1)] ||
                                        'N/A';
                                };
                                return {
                                    name: get('name'),
                                    rank: get('rank'),
                                    tuition: get('tuition'),
                                    rate: get('rate'),
                                    salary: get('salary'),
                                    loc: get('loc') || get('location'), // Common alias
                                };
                            };
                            u1Raw = void 0, u2Raw = void 0;
                            // Handle Array response [ {uni1}, {uni2} ]
                            if (Array.isArray(parsed) && parsed.length >= 2) {
                                u1Raw = parsed[0];
                                u2Raw = parsed[1];
                            }
                            else if (parsed && typeof parsed === 'object') {
                                if (parsed.universities &&
                                    Array.isArray(parsed.universities) &&
                                    parsed.universities.length >= 2) {
                                    u1Raw = parsed.universities[0];
                                    u2Raw = parsed.universities[1];
                                }
                                else {
                                    // Handle Object response { uni1: {...}, uni2: {...} }
                                    u1Raw = parsed.uni1 || ((_a = parsed.result) === null || _a === void 0 ? void 0 : _a.uni1) || ((_b = parsed.comparison) === null || _b === void 0 ? void 0 : _b.uni1);
                                    u2Raw = parsed.uni2 || ((_c = parsed.result) === null || _c === void 0 ? void 0 : _c.uni2) || ((_d = parsed.comparison) === null || _d === void 0 ? void 0 : _d.uni2);
                                }
                            }
                            return [2 /*return*/, {
                                    uni1: u1Raw
                                        ? normalize(u1Raw)
                                        : {
                                            name: uni1,
                                            rank: 'N/A',
                                            tuition: 'N/A',
                                            rate: 'N/A',
                                            salary: 'N/A',
                                            loc: 'Unknown',
                                        },
                                    uni2: u2Raw
                                        ? normalize(u2Raw)
                                        : {
                                            name: uni2,
                                            rank: 'N/A',
                                            tuition: 'N/A',
                                            rate: 'N/A',
                                            salary: 'N/A',
                                            loc: 'Unknown',
                                        },
                                }];
                        case 2:
                            error_1 = _e.sent();
                            console.error('CRITICAL ERROR comparing universities:', error_1);
                            throw error_1;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return UniversityComparisonService_1;
    }());
    __setFunctionName(_classThis, "UniversityComparisonService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UniversityComparisonService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UniversityComparisonService = _classThis;
}();
exports.UniversityComparisonService = UniversityComparisonService;

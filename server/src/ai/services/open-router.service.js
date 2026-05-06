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
exports.OpenRouterService = void 0;
var common_1 = require("@nestjs/common");
var OpenRouterService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var OpenRouterService = _classThis = /** @class */ (function () {
        function OpenRouterService_1() {
            this.logger = new common_1.Logger(OpenRouterService.name);
            this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
            this.apiKey = process.env.OPENROUTER_API_KEY;
        }
        OpenRouterService_1.prototype.generateResponse = function (systemPrompt_1, userPrompt_1) {
            return __awaiter(this, arguments, void 0, function (systemPrompt, userPrompt, temperature) {
                var attempts, maxAttempts, lastError, response, errorText, data, text, error_1;
                var _a;
                if (temperature === void 0) { temperature = 0.7; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.apiKey) {
                                this.logger.warn('OPENROUTER_API_KEY is not set');
                                throw new Error('API key is missing');
                            }
                            attempts = 0;
                            maxAttempts = 3;
                            _b.label = 1;
                        case 1:
                            if (!(attempts < maxAttempts)) return [3 /*break*/, 11];
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 9, , 10]);
                            attempts++;
                            if (!(attempts > 1)) return [3 /*break*/, 4];
                            this.logger.log("Retry attempt ".concat(attempts, "/").concat(maxAttempts, " for OpenRouter API..."));
                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000 * attempts); })];
                        case 3:
                            _b.sent(); // Backoff
                            _b.label = 4;
                        case 4: return [4 /*yield*/, fetch(this.apiUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: "Bearer ".concat(this.apiKey),
                                    'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
                                    'X-Title': 'EduLoan AI Service', // Optional, helps with tracking
                                },
                                body: JSON.stringify({
                                    model: 'google/gemini-2.0-flash-001',
                                    messages: [
                                        { role: 'system', content: systemPrompt },
                                        { role: 'user', content: userPrompt },
                                    ],
                                    temperature: temperature,
                                }),
                            })];
                        case 5:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 7];
                            return [4 /*yield*/, response.text()];
                        case 6:
                            errorText = _b.sent();
                            this.logger.error("OpenRouter API error (Attempt ".concat(attempts, "): ").concat(response.status, " - ").concat(errorText));
                            throw new Error("OpenRouter API failed: ".concat(response.statusText, " - ").concat(errorText));
                        case 7: return [4 /*yield*/, response.json()];
                        case 8:
                            data = _b.sent();
                            if (!data.choices || data.choices.length === 0) {
                                this.logger.error('No choices returned from OpenRouter:', JSON.stringify(data));
                                throw new Error('No completion returned from OpenRouter');
                            }
                            text = (_a = data.choices[0].message) === null || _a === void 0 ? void 0 : _a.content;
                            if (!text)
                                throw new Error('Empty text content from OpenRouter');
                            return [2 /*return*/, text];
                        case 9:
                            error_1 = _b.sent();
                            lastError = error_1;
                            this.logger.error("Attempt ".concat(attempts, " failed: ").concat(error_1.message));
                            return [3 /*break*/, 10];
                        case 10: return [3 /*break*/, 1];
                        case 11:
                            this.logger.error('All attempts to call OpenRouter API failed', lastError);
                            throw lastError;
                    }
                });
            });
        };
        return OpenRouterService_1;
    }());
    __setFunctionName(_classThis, "OpenRouterService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OpenRouterService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OpenRouterService = _classThis;
}();
exports.OpenRouterService = OpenRouterService;

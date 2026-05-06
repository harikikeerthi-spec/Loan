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
exports.UniversityInquiryService = void 0;
var common_1 = require("@nestjs/common");
var UniversityInquiryService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var UniversityInquiryService = _classThis = /** @class */ (function () {
        function UniversityInquiryService_1(supabase, emailService) {
            this.supabase = supabase;
            this.emailService = emailService;
        }
        Object.defineProperty(UniversityInquiryService_1.prototype, "db", {
            get: function () {
                return this.supabase.getClient();
            },
            enumerable: false,
            configurable: true
        });
        UniversityInquiryService_1.prototype.createInquiry = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, inquiry, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('UniversityInquiry')
                                .insert({
                                userId: data.userId,
                                name: data.name,
                                email: data.email,
                                mobile: data.mobile,
                                universityName: data.universityName,
                                type: data.type,
                            })
                                .select()
                                .single()];
                        case 1:
                            _a = _b.sent(), inquiry = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [4 /*yield*/, this.sendInquiryEmails(data)];
                        case 2:
                            _b.sent();
                            return [2 /*return*/, inquiry];
                    }
                });
            });
        };
        UniversityInquiryService_1.prototype.getInquiriesByUser = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('UniversityInquiry')
                                .select('*')
                                .eq('userId', userId)
                                .order('createdAt', { ascending: false })];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data || []];
                    }
                });
            });
        };
        UniversityInquiryService_1.prototype.checkInquiry = function (email, universityName, type) {
            return __awaiter(this, void 0, void 0, function () {
                var existing;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('UniversityInquiry')
                                .select('id')
                                .eq('email', email)
                                .eq('universityName', universityName)
                                .eq('type', type)
                                .single()];
                        case 1:
                            existing = (_a.sent()).data;
                            return [2 /*return*/, { exists: !!existing }];
                    }
                });
            });
        };
        UniversityInquiryService_1.prototype.sendInquiryEmails = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var typeLabel, userHtml, adminHtml, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            typeLabel = data.type === 'callback' ? 'Request a Callback' : 'Fasttrack Application';
                            userHtml = "\n      <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;\">\n        <div style=\"background: linear-gradient(135deg, #6605c7 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 24px;\">\n          <h1 style=\"color: white; margin: 0; font-size: 24px;\">Vidhya Loan</h1>\n        </div>\n        <div style=\"padding: 0 10px;\">\n          <h2 style=\"color: #111827; margin-bottom: 16px;\">We've received your request!</h2>\n          <p style=\"color: #4b5563; font-size: 16px; line-height: 1.5;\">Hi ".concat(data.name, ",</p>\n          <p style=\"color: #4b5563; font-size: 16px; line-height: 1.5;\">We have received your ").concat(typeLabel.toLowerCase(), " inquiry for <strong>").concat(data.universityName, "</strong>.</p>\n          <div style=\"background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;\">\n            <p style=\"margin: 5px 0;\"><strong>Name:</strong> ").concat(data.name, "</p>\n            <p style=\"margin: 5px 0;\"><strong>Mobile:</strong> ").concat(data.mobile, "</p>\n            <p style=\"margin: 5px 0;\"><strong>University:</strong> ").concat(data.universityName, "</p>\n            <p style=\"margin: 5px 0;\"><strong>Request:</strong> ").concat(typeLabel, "</p>\n          </div>\n          <p style=\"color: #4b5563; font-size: 16px;\">Our education consultants will call you shortly.</p>\n        </div>\n      </div>\n    ");
                            adminHtml = "\n      <div style=\"font-family: Arial, sans-serif; padding: 20px;\">\n        <h2>New Lead Generated</h2>\n        <p><strong>Name:</strong> ".concat(data.name, "</p>\n        <p><strong>Email:</strong> ").concat(data.email, "</p>\n        <p><strong>Mobile:</strong> ").concat(data.mobile, "</p>\n        <p><strong>University:</strong> ").concat(data.universityName, "</p>\n        <p><strong>Lead Type:</strong> ").concat(typeLabel, "</p>\n      </div>\n    ");
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, this.emailService.sendMail(data.email, "Inquiry Received: ".concat(data.universityName), userHtml)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.emailService.sendMail(process.env.ADMIN_EMAIL || 'admin@vidhyaloan.com', "NEW LEAD: ".concat(data.name, " - ").concat(typeLabel), adminHtml)];
                        case 3:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            e_1 = _a.sent();
                            console.error('Error sending lead emails', e_1);
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        return UniversityInquiryService_1;
    }());
    __setFunctionName(_classThis, "UniversityInquiryService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UniversityInquiryService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UniversityInquiryService = _classThis;
}();
exports.UniversityInquiryService = UniversityInquiryService;

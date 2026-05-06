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
exports.EmailService = void 0;
var common_1 = require("@nestjs/common");
var nodemailer = require("nodemailer");
var EmailService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var EmailService = _classThis = /** @class */ (function () {
        function EmailService_1(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(EmailService.name);
            this.initializeTransporter();
        }
        EmailService_1.prototype.initializeTransporter = function () {
            var host = this.configService.get('EMAIL_HOST') || 'smtp.gmail.com';
            var port = this.configService.get('EMAIL_PORT') || 587;
            var user = this.configService.get('EMAIL_USER');
            var pass = this.configService.get('EMAIL_PASS');
            var from = this.configService.get('EMAIL_FROM') || "\"VidhyaLoan\" <".concat(user, ">");
            this.transporter = nodemailer.createTransport({
                host: host,
                port: port,
                secure: port === 465,
                auth: { user: user, pass: pass },
                from: from,
            });
        };
        EmailService_1.prototype.sendChatNotificationEmail = function (to, senderName, senderRole, message, conversationContext) {
            return __awaiter(this, void 0, void 0, function () {
                var htmlContent, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            htmlContent = "\n        <div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;\">\n          <div style=\"background: linear-gradient(135deg, #6605c7 0%, #5504a6 100%); padding: 40px; border-radius: 16px; color: white; text-align: center; margin-bottom: 30px;\">\n            <h1 style=\"margin: 0; font-size: 28px; font-weight: bold;\">VidhyaLoan</h1>\n            <p style=\"margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;\">New Message in Your Application</p>\n          </div>\n\n          <div style=\"background: #f9f9f9; padding: 30px; border-radius: 12px; margin-bottom: 30px;\">\n            <p style=\"margin: 0 0 20px 0; color: #666; font-size: 14px;\">\n              <strong>".concat(senderName, "</strong> (").concat(senderRole, ") has sent you a message regarding your loan application.\n            </p>\n\n            ").concat(conversationContext.applicationNumber ? "\n              <div style=\"background: white; padding: 15px; border-left: 4px solid #6605c7; border-radius: 4px; margin-bottom: 20px;\">\n                <p style=\"margin: 0; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;\">Application Details</p>\n                <p style=\"margin: 8px 0 0 0; font-size: 16px; font-weight: bold; color: #333;\">\n                  ".concat(conversationContext.applicationNumber, "\n                  ").concat(conversationContext.bank ? " \u2022 ".concat(conversationContext.bank) : '', "\n                </p>\n              </div>\n            ") : '', "\n\n            <div style=\"background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e0e0e0;\">\n              <p style=\"margin: 0; color: #666; font-size: 14px; line-height: 1.6; white-space: pre-wrap;\">\n                ").concat(this.escapeHtml(message), "\n              </p>\n            </div>\n\n            <div style=\"background: #f0f4ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;\">\n              <p style=\"margin: 0; color: #6605c7; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;\">Subject</p>\n              <p style=\"margin: 8px 0 0 0; color: #333; font-size: 14px;\">\n                ").concat(this.escapeHtml(conversationContext.subject), "\n              </p>\n            </div>\n          </div>\n\n          <div style=\"text-align: center; margin-bottom: 30px;\">\n            <a href=\"").concat(process.env.FRONTEND_URL || 'http://localhost:3000', "/dashboard#applications\" \n               style=\"display: inline-block; background: linear-gradient(135deg, #6605c7 0%, #5504a6 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;\">\n              View Application\n            </a>\n          </div>\n\n          <div style=\"border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #999; font-size: 12px;\">\n            <p style=\"margin: 0 0 10px 0;\">\n              You received this email because you have an active loan application with VidhyaLoan.\n            </p>\n            <p style=\"margin: 0;\">\n              \u00A9 ").concat(new Date().getFullYear(), " VidhyaLoan. All rights reserved.\n            </p>\n          </div>\n        </div>\n      ");
                            return [4 /*yield*/, this.transporter.sendMail({
                                    to: to,
                                    subject: "New Message: ".concat(conversationContext.subject),
                                    html: htmlContent,
                                    text: "".concat(senderName, " (").concat(senderRole, ") sent: ").concat(message),
                                })];
                        case 1:
                            _a.sent();
                            this.logger.log("Email sent to ".concat(to));
                            return [2 /*return*/, true];
                        case 2:
                            error_1 = _a.sent();
                            this.logger.error("Failed to send email to ".concat(to, ":"), error_1);
                            return [2 /*return*/, false];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        EmailService_1.prototype.sendDocumentNotificationEmail = function (to, documentDetails) {
            return __awaiter(this, void 0, void 0, function () {
                var htmlContent, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            htmlContent = "\n        <div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;\">\n          <div style=\"background: linear-gradient(135deg, #6605c7 0%, #5504a6 100%); padding: 40px; border-radius: 16px; color: white; text-align: center; margin-bottom: 30px;\">\n            <h1 style=\"margin: 0; font-size: 28px; font-weight: bold;\">VidhyaLoan</h1>\n            <p style=\"margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;\">Document Shared with You</p>\n          </div>\n\n          <div style=\"background: #f9f9f9; padding: 30px; border-radius: 12px; margin-bottom: 30px;\">\n            <p style=\"margin: 0 0 20px 0; color: #666; font-size: 14px;\">\n              A document has been shared with you by <strong>".concat(documentDetails.uploadedBy, "</strong> (").concat(documentDetails.uploadedByRole, ").\n            </p>\n\n            <div style=\"background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #6605c7; text-align: center;\">\n              <p style=\"margin: 0; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;\">Document Details</p>\n              <p style=\"margin: 12px 0 8px 0; font-size: 18px; font-weight: bold; color: #333;\">\n                \uD83D\uDCC4 ").concat(this.escapeHtml(documentDetails.documentName), "\n              </p>\n              <p style=\"margin: 8px 0 0 0; font-size: 12px; color: #6605c7; font-weight: bold;\">\n                Status: ").concat(documentDetails.status, "\n              </p>\n            </div>\n\n            <div style=\"background: #f0f4ff; padding: 15px; border-radius: 8px;\">\n              <p style=\"margin: 0 0 10px 0; font-size: 12px; color: #6605c7; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;\">Application</p>\n              <p style=\"margin: 0; font-size: 14px; color: #333;\">\n                ").concat(documentDetails.applicationNumber, "\n                ").concat(documentDetails.bank ? " \u2022 ".concat(documentDetails.bank) : '', "\n              </p>\n            </div>\n          </div>\n\n          <div style=\"text-align: center;\">\n            <a href=\"").concat(process.env.FRONTEND_URL || 'http://localhost:3000', "/document-vault\" \n               style=\"display: inline-block; background: linear-gradient(135deg, #6605c7 0%, #5504a6 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;\">\n              View Document\n            </a>\n          </div>\n\n          <div style=\"border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #999; font-size: 12px; margin-top: 30px;\">\n            <p style=\"margin: 0;\">\u00A9 ").concat(new Date().getFullYear(), " VidhyaLoan. All rights reserved.</p>\n          </div>\n        </div>\n      ");
                            return [4 /*yield*/, this.transporter.sendMail({
                                    to: to,
                                    subject: "Document Shared: ".concat(documentDetails.documentName),
                                    html: htmlContent,
                                    text: "Document ".concat(documentDetails.documentName, " has been shared with you for application ").concat(documentDetails.applicationNumber),
                                })];
                        case 1:
                            _a.sent();
                            this.logger.log("Document notification email sent to ".concat(to));
                            return [2 /*return*/, true];
                        case 2:
                            error_2 = _a.sent();
                            this.logger.error("Failed to send document email to ".concat(to, ":"), error_2);
                            return [2 /*return*/, false];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        EmailService_1.prototype.escapeHtml = function (text) {
            var map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;',
            };
            return text.replace(/[&<>"']/g, function (m) { return map[m]; });
        };
        return EmailService_1;
    }());
    __setFunctionName(_classThis, "EmailService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EmailService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EmailService = _classThis;
}();
exports.EmailService = EmailService;

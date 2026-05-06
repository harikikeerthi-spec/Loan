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
exports.AuthController = void 0;
var common_1 = require("@nestjs/common");
var AuthController = function () {
    var _classDecorators = [(0, common_1.Controller)('auth')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _checkUserExists_decorators;
    var _sendOtp_decorators;
    var _verifyOtp_decorators;
    var _getUserDashboard_decorators;
    var _updateUserDetails_decorators;
    var AuthController = _classThis = /** @class */ (function () {
        function AuthController_1(authService) {
            this.authService = (__runInitializers(this, _instanceExtraInitializers), authService);
        }
        /**
         * Check if a user exists in the system
         * GET /auth/check-user/:email
         * @param email - User's email address
         * @returns { exists: boolean, message: string }
         */
        AuthController_1.prototype.checkUserExists = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.authService.checkUserExists(email)];
                });
            });
        };
        // ==================== UNIFIED OTP FLOW ====================
        /**
         * Step 1: Send OTP to email (Works for both new and existing users)
         * POST /auth/send-otp
         * @body email: string (required)
         * @returns { success: boolean, message: string, userExists: boolean }
         */
        AuthController_1.prototype.sendOtp = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.authService.sendOtpUnified(body.email)];
                });
            });
        };
        /**
         * Step 2: Verify OTP and determine user flow
         * POST /auth/verify-otp
         * @body email: string (required), otp: string (required, 6 digits)
         * @returns {
         *   success: boolean,
         *   access_token: string,
         *   userExists: boolean,
         *   hasUserDetails: boolean,
         *   message: string
         * }
         *
         * Flow:
         * - If userExists: true && hasUserDetails: true → Navigate to homepage
         * - If userExists: true && hasUserDetails: false → Navigate to user-details.html
         * - If userExists: false → Navigate to user-details.html (new user)
         */
        AuthController_1.prototype.verifyOtp = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.authService.verifyOtpUnified(body.email, body.otp)];
                });
            });
        };
        // ==================== USER DASHBOARD ====================
        /**
         * Get user dashboard data and profile information
         * POST /auth/dashboard
         * @body email: string (required)
         * @returns { success: boolean, user: { id, email, firstName, lastName, phoneNumber, dateOfBirth, createdAt } }
         */
        AuthController_1.prototype.getUserDashboard = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.authService.getUserDashboard(body.email)];
                });
            });
        };
        /**
         * Update user details (name, phone, date of birth)
         * POST /auth/update-details
         * @body email: string (required), firstName: string (required), lastName: string (required),
         *       phoneNumber: string (required), dateOfBirth: string (required, DD-MM-YYYY format)
         * @returns { success: boolean, message: string, user?: { email, firstName, lastName, phoneNumber, dateOfBirth } }
         */
        AuthController_1.prototype.updateUserDetails = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.authService.updateUserDetails(body.email, body.firstName, body.lastName, body.phoneNumber, body.dateOfBirth)];
                });
            });
        };
        return AuthController_1;
    }());
    __setFunctionName(_classThis, "AuthController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _checkUserExists_decorators = [(0, common_1.Get)('check-user/:email')];
        _sendOtp_decorators = [(0, common_1.Post)('send-otp')];
        _verifyOtp_decorators = [(0, common_1.Post)('verify-otp')];
        _getUserDashboard_decorators = [(0, common_1.Post)('dashboard')];
        _updateUserDetails_decorators = [(0, common_1.Post)('update-details')];
        __esDecorate(_classThis, null, _checkUserExists_decorators, { kind: "method", name: "checkUserExists", static: false, private: false, access: { has: function (obj) { return "checkUserExists" in obj; }, get: function (obj) { return obj.checkUserExists; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendOtp_decorators, { kind: "method", name: "sendOtp", static: false, private: false, access: { has: function (obj) { return "sendOtp" in obj; }, get: function (obj) { return obj.sendOtp; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _verifyOtp_decorators, { kind: "method", name: "verifyOtp", static: false, private: false, access: { has: function (obj) { return "verifyOtp" in obj; }, get: function (obj) { return obj.verifyOtp; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUserDashboard_decorators, { kind: "method", name: "getUserDashboard", static: false, private: false, access: { has: function (obj) { return "getUserDashboard" in obj; }, get: function (obj) { return obj.getUserDashboard; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateUserDetails_decorators, { kind: "method", name: "updateUserDetails", static: false, private: false, access: { has: function (obj) { return "updateUserDetails" in obj; }, get: function (obj) { return obj.updateUserDetails; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthController = _classThis;
}();
exports.AuthController = AuthController;

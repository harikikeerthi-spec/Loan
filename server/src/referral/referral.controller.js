"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.ReferralController = void 0;
var common_1 = require("@nestjs/common");
var user_guard_1 = require("../auth/user.guard");
var ReferralController = function () {
    var _classDecorators = [(0, common_1.Controller)('referral')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getMyCode_decorators;
    var _getStats_decorators;
    var _getReferralList_decorators;
    var _validateCode_decorators;
    var _recordReferral_decorators;
    var _sendInvite_decorators;
    var _getLeaderboard_decorators;
    var _recordVisit_decorators;
    var ReferralController = _classThis = /** @class */ (function () {
        function ReferralController_1(referralService) {
            this.referralService = (__runInitializers(this, _instanceExtraInitializers), referralService);
        }
        /**
         * GET /referral/my-code
         * Get or generate the current user's referral code
         */
        ReferralController_1.prototype.getMyCode = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                var userId, result, error_1;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 2, , 3]);
                            userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.sub) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
                            if (!userId) {
                                throw new common_1.HttpException('Unauthorized', common_1.HttpStatus.UNAUTHORIZED);
                            }
                            return [4 /*yield*/, this.referralService.getOrCreateReferralCode(userId)];
                        case 1:
                            result = _c.sent();
                            return [2 /*return*/, __assign({ success: true }, result)];
                        case 2:
                            error_1 = _c.sent();
                            throw new common_1.HttpException(error_1.message || 'Failed to get referral code', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * GET /referral/stats
         * Get referral stats for the current user
         */
        ReferralController_1.prototype.getStats = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                var userId, stats, error_2;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 2, , 3]);
                            userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.sub) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
                            if (!userId) {
                                throw new common_1.HttpException('Unauthorized', common_1.HttpStatus.UNAUTHORIZED);
                            }
                            return [4 /*yield*/, this.referralService.getReferralStats(userId)];
                        case 1:
                            stats = _c.sent();
                            return [2 /*return*/, __assign({ success: true }, stats)];
                        case 2:
                            error_2 = _c.sent();
                            throw new common_1.HttpException(error_2.message || 'Failed to get referral stats', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * GET /referral/list
         * Get list of all referrals made by the current user
         */
        ReferralController_1.prototype.getReferralList = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                var userId, referrals, error_3;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 2, , 3]);
                            userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.sub) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
                            if (!userId) {
                                throw new common_1.HttpException('Unauthorized', common_1.HttpStatus.UNAUTHORIZED);
                            }
                            return [4 /*yield*/, this.referralService.getReferralList(userId)];
                        case 1:
                            referrals = _c.sent();
                            return [2 /*return*/, { success: true, referrals: referrals }];
                        case 2:
                            error_3 = _c.sent();
                            throw new common_1.HttpException(error_3.message || 'Failed to get referral list', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * GET /referral/validate/:code
         * Validate a referral code (public endpoint)
         */
        ReferralController_1.prototype.validateCode = function (code) {
            return __awaiter(this, void 0, void 0, function () {
                var result, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.referralService.validateReferralCode(code)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, __assign({ success: true }, result)];
                        case 2:
                            error_4 = _a.sent();
                            throw new common_1.HttpException(error_4.message || 'Failed to validate referral code', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * POST /referral/record
         * Record a referral when someone signs up with a code (called internally during signup)
         */
        ReferralController_1.prototype.recordReferral = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var result, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.referralCode || !body.refereeEmail) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Referral code and referee email are required',
                                    }];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.referralService.recordReferral(body.referralCode, body.refereeEmail, body.refereeId)];
                        case 2:
                            result = _a.sent();
                            return [2 /*return*/, { success: true, referral: result }];
                        case 3:
                            error_5 = _a.sent();
                            throw new common_1.HttpException(error_5.message || 'Failed to record referral', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * POST /referral/invite
         * Send an invite to a friend's email
         */
        ReferralController_1.prototype.sendInvite = function (req, body) {
            return __awaiter(this, void 0, void 0, function () {
                var userId, referral, error_6;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            if (!body || !body.email) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email is required',
                                    }];
                            }
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 3, , 4]);
                            userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.sub) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
                            if (!userId) {
                                throw new common_1.HttpException('Unauthorized', common_1.HttpStatus.UNAUTHORIZED);
                            }
                            return [4 /*yield*/, this.referralService.sendInvite(userId, body.email)];
                        case 2:
                            referral = _d.sent();
                            return [2 /*return*/, { success: true, referral: referral }];
                        case 3:
                            error_6 = _d.sent();
                            throw new common_1.HttpException(error_6.message || 'Failed to send invite', ((_c = error_6.message) === null || _c === void 0 ? void 0 : _c.includes('already')) ? common_1.HttpStatus.CONFLICT : common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * GET /referral/leaderboard
         * Get top referrers leaderboard
         */
        ReferralController_1.prototype.getLeaderboard = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                var leaderboard, error_7;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.referralService.getLeaderboard(limit ? parseInt(limit, 10) : 10)];
                        case 1:
                            leaderboard = _a.sent();
                            return [2 /*return*/, { success: true, leaderboard: leaderboard }];
                        case 2:
                            error_7 = _a.sent();
                            throw new common_1.HttpException(error_7.message || 'Failed to get leaderboard', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * POST /referral/visit/:code
         * Record a click/visit on a referral link (public endpoint)
         */
        ReferralController_1.prototype.recordVisit = function (code, req) {
            return __awaiter(this, void 0, void 0, function () {
                var ip, userAgent, error_8;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                            userAgent = req.headers['user-agent'];
                            return [4 /*yield*/, this.referralService.recordVisit(code, ip, userAgent)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                        case 2:
                            error_8 = _a.sent();
                            // Don't fail the visit just because recording it failed
                            return [2 /*return*/, { success: false, message: error_8.message }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return ReferralController_1;
    }());
    __setFunctionName(_classThis, "ReferralController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getMyCode_decorators = [(0, common_1.UseGuards)(user_guard_1.UserGuard), (0, common_1.Get)('my-code')];
        _getStats_decorators = [(0, common_1.UseGuards)(user_guard_1.UserGuard), (0, common_1.Get)('stats')];
        _getReferralList_decorators = [(0, common_1.UseGuards)(user_guard_1.UserGuard), (0, common_1.Get)('list')];
        _validateCode_decorators = [(0, common_1.Get)('validate/:code')];
        _recordReferral_decorators = [(0, common_1.Post)('record')];
        _sendInvite_decorators = [(0, common_1.UseGuards)(user_guard_1.UserGuard), (0, common_1.Post)('invite')];
        _getLeaderboard_decorators = [(0, common_1.Get)('leaderboard')];
        _recordVisit_decorators = [(0, common_1.Post)('visit/:code')];
        __esDecorate(_classThis, null, _getMyCode_decorators, { kind: "method", name: "getMyCode", static: false, private: false, access: { has: function (obj) { return "getMyCode" in obj; }, get: function (obj) { return obj.getMyCode; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getStats_decorators, { kind: "method", name: "getStats", static: false, private: false, access: { has: function (obj) { return "getStats" in obj; }, get: function (obj) { return obj.getStats; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getReferralList_decorators, { kind: "method", name: "getReferralList", static: false, private: false, access: { has: function (obj) { return "getReferralList" in obj; }, get: function (obj) { return obj.getReferralList; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _validateCode_decorators, { kind: "method", name: "validateCode", static: false, private: false, access: { has: function (obj) { return "validateCode" in obj; }, get: function (obj) { return obj.validateCode; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _recordReferral_decorators, { kind: "method", name: "recordReferral", static: false, private: false, access: { has: function (obj) { return "recordReferral" in obj; }, get: function (obj) { return obj.recordReferral; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendInvite_decorators, { kind: "method", name: "sendInvite", static: false, private: false, access: { has: function (obj) { return "sendInvite" in obj; }, get: function (obj) { return obj.sendInvite; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLeaderboard_decorators, { kind: "method", name: "getLeaderboard", static: false, private: false, access: { has: function (obj) { return "getLeaderboard" in obj; }, get: function (obj) { return obj.getLeaderboard; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _recordVisit_decorators, { kind: "method", name: "recordVisit", static: false, private: false, access: { has: function (obj) { return "recordVisit" in obj; }, get: function (obj) { return obj.recordVisit; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ReferralController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ReferralController = _classThis;
}();
exports.ReferralController = ReferralController;

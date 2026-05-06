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
exports.ReferralService = void 0;
var common_1 = require("@nestjs/common");
var ReferralService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ReferralService = _classThis = /** @class */ (function () {
        function ReferralService_1(supabase) {
            this.supabase = supabase;
            this.logger = { warn: function (m) { return console.warn(m); } };
        }
        Object.defineProperty(ReferralService_1.prototype, "db", {
            get: function () {
                return this.supabase.getClient();
            },
            enumerable: false,
            configurable: true
        });
        ReferralService_1.prototype.generateCode = function () {
            var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            var code = 'VL-';
            for (var i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        };
        ReferralService_1.prototype.getOrCreateReferralCode = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var user, code, exists, existing, _a, updated, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('User')
                                .select('id, referralCode, firstName, lastName, email')
                                .eq('id', userId)
                                .single()];
                        case 1:
                            user = (_b.sent()).data;
                            if (!user)
                                throw new Error('User not found');
                            if (user.referralCode)
                                return [2 /*return*/, { referralCode: user.referralCode, user: user }];
                            code = '';
                            exists = true;
                            _b.label = 2;
                        case 2:
                            if (!exists) return [3 /*break*/, 4];
                            code = this.generateCode();
                            return [4 /*yield*/, this.db.from('User').select('id').eq('referralCode', code).single()];
                        case 3:
                            existing = (_b.sent()).data;
                            exists = !!existing;
                            return [3 /*break*/, 2];
                        case 4: return [4 /*yield*/, this.db
                                .from('User')
                                .update({ referralCode: code })
                                .eq('id', userId)
                                .select('id, referralCode, firstName, lastName, email')
                                .single()];
                        case 5:
                            _a = _b.sent(), updated = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, { referralCode: updated.referralCode, user: updated }];
                    }
                });
            });
        };
        ReferralService_1.prototype.getReferralStats = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var user, _a, totalReferrals, completedReferrals, signedUpReferrals, pendingReferrals, totalVisits, completedCount, tier, nextTierAt, rewards;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('User')
                                .select('referralCode, firstName')
                                .eq('id', userId)
                                .single()];
                        case 1:
                            user = (_b.sent()).data;
                            return [4 /*yield*/, Promise.all([
                                    this.db.from('Referral').select('*', { count: 'exact', head: true }).eq('referrerId', userId),
                                    this.db.from('Referral').select('*', { count: 'exact', head: true }).eq('referrerId', userId).eq('status', 'completed'),
                                    this.db.from('Referral').select('*', { count: 'exact', head: true }).eq('referrerId', userId).eq('status', 'signed_up'),
                                    this.db.from('Referral').select('*', { count: 'exact', head: true }).eq('referrerId', userId).eq('status', 'pending'),
                                    this.db.from('ReferralVisit').select('*', { count: 'exact', head: true }).eq('referrerId', userId),
                                ])];
                        case 2:
                            _a = _b.sent(), totalReferrals = _a[0].count, completedReferrals = _a[1].count, signedUpReferrals = _a[2].count, pendingReferrals = _a[3].count, totalVisits = _a[4].count;
                            completedCount = completedReferrals || 0;
                            tier = 'starter';
                            nextTierAt = 3;
                            if (completedCount >= 10) {
                                tier = 'diamond';
                                nextTierAt = null;
                            }
                            else if (completedCount >= 7) {
                                tier = 'gold';
                                nextTierAt = 10;
                            }
                            else if (completedCount >= 5) {
                                tier = 'silver';
                                nextTierAt = 7;
                            }
                            else if (completedCount >= 3) {
                                tier = 'bronze';
                                nextTierAt = 5;
                            }
                            rewards = this.calculateRewards(completedCount);
                            return [2 /*return*/, {
                                    referralCode: user === null || user === void 0 ? void 0 : user.referralCode,
                                    firstName: user === null || user === void 0 ? void 0 : user.firstName,
                                    totalReferrals: totalReferrals || 0,
                                    completedReferrals: completedCount,
                                    signedUpReferrals: signedUpReferrals || 0,
                                    pendingReferrals: pendingReferrals || 0,
                                    totalVisits: totalVisits || 0,
                                    tier: tier,
                                    nextTierAt: nextTierAt,
                                    rewards: rewards,
                                }];
                    }
                });
            });
        };
        ReferralService_1.prototype.getReferralList = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var referrals;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Referral')
                                .select('*, referee:User!refereeId(firstName, lastName, email)')
                                .eq('referrerId', userId)
                                .order('createdAt', { ascending: false })];
                        case 1:
                            referrals = (_a.sent()).data;
                            return [2 /*return*/, (referrals || []).map(function (r) {
                                    var _a;
                                    return ({
                                        id: r.id,
                                        refereeEmail: r.refereeEmail || ((_a = r.referee) === null || _a === void 0 ? void 0 : _a.email),
                                        refereeName: r.referee ? "".concat(r.referee.firstName || '', " ").concat(r.referee.lastName || '').trim() : null,
                                        status: r.status,
                                        reward: r.reward,
                                        createdAt: r.createdAt,
                                        completedAt: r.completedAt,
                                    });
                                })];
                    }
                });
            });
        };
        ReferralService_1.prototype.validateReferralCode = function (code) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('User')
                                .select('id, firstName, lastName')
                                .eq('referralCode', code.toUpperCase().trim())
                                .single()];
                        case 1:
                            user = (_a.sent()).data;
                            if (!user)
                                return [2 /*return*/, { valid: false }];
                            return [2 /*return*/, {
                                    valid: true,
                                    referrerName: "".concat(user.firstName || '', " ").concat(user.lastName || '').trim() || 'A friend',
                                }];
                    }
                });
            });
        };
        ReferralService_1.prototype.recordReferral = function (referralCode, refereeEmail, refereeId) {
            return __awaiter(this, void 0, void 0, function () {
                var referrer, existing, _a, data, error_1, _b, referral, error;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('User')
                                .select('*')
                                .eq('referralCode', referralCode.toUpperCase().trim())
                                .single()];
                        case 1:
                            referrer = (_c.sent()).data;
                            if (!referrer) {
                                this.logger.warn("Invalid referral code used: ".concat(referralCode));
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, this.db
                                    .from('Referral')
                                    .select('id')
                                    .eq('referrerId', referrer.id)
                                    .eq('refereeEmail', refereeEmail)
                                    .single()];
                        case 2:
                            existing = (_c.sent()).data;
                            if (!existing) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.db
                                    .from('Referral')
                                    .update({ refereeId: refereeId, status: refereeId ? 'signed_up' : 'pending' })
                                    .eq('id', existing.id)
                                    .select()
                                    .single()];
                        case 3:
                            _a = _c.sent(), data = _a.data, error_1 = _a.error;
                            if (error_1)
                                throw error_1;
                            return [2 /*return*/, data];
                        case 4: return [4 /*yield*/, this.db
                                .from('Referral')
                                .insert({ referrerId: referrer.id, refereeEmail: refereeEmail, refereeId: refereeId, status: refereeId ? 'signed_up' : 'pending' })
                                .select()
                                .single()];
                        case 5:
                            _b = _c.sent(), referral = _b.data, error = _b.error;
                            if (error)
                                throw error;
                            if (!refereeId) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.db.from('User').update({ referredById: referrer.id }).eq('id', refereeId)];
                        case 6:
                            _c.sent();
                            _c.label = 7;
                        case 7: return [2 /*return*/, referral];
                    }
                });
            });
        };
        ReferralService_1.prototype.completeReferral = function (refereeId) {
            return __awaiter(this, void 0, void 0, function () {
                var referral, completedCount, reward, _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Referral')
                                .select('*')
                                .eq('refereeId', refereeId)
                                .single()];
                        case 1:
                            referral = (_b.sent()).data;
                            if (!referral || referral.status === 'completed')
                                return [2 /*return*/, null];
                            return [4 /*yield*/, this.db
                                    .from('Referral')
                                    .select('*', { count: 'exact', head: true })
                                    .eq('referrerId', referral.referrerId)
                                    .eq('status', 'completed')];
                        case 2:
                            completedCount = (_b.sent()).count;
                            reward = this.getRewardForCount((completedCount || 0) + 1);
                            return [4 /*yield*/, this.db
                                    .from('Referral')
                                    .update({ status: 'completed', completedAt: new Date().toISOString(), reward: reward })
                                    .eq('id', referral.id)
                                    .select()
                                    .single()];
                        case 3:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        ReferralService_1.prototype.sendInvite = function (userId, email) {
            return __awaiter(this, void 0, void 0, function () {
                var user, existing, _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('User')
                                .select('email, referralCode')
                                .eq('id', userId)
                                .single()];
                        case 1:
                            user = (_b.sent()).data;
                            if (!user)
                                throw new Error('User not found');
                            if (user.email === email)
                                throw new Error('You cannot refer yourself');
                            return [4 /*yield*/, this.db
                                    .from('Referral')
                                    .select('id')
                                    .eq('referrerId', userId)
                                    .eq('refereeEmail', email)
                                    .single()];
                        case 2:
                            existing = (_b.sent()).data;
                            if (existing)
                                throw new Error('You have already invited this person');
                            return [4 /*yield*/, this.db
                                    .from('Referral')
                                    .insert({ referrerId: userId, refereeEmail: email, status: 'pending' })
                                    .select()
                                    .single()];
                        case 3:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        ReferralService_1.prototype.getLeaderboard = function () {
            return __awaiter(this, arguments, void 0, function (limit) {
                var referrals, counts, _i, referrals_1, r, sorted, leaderboard;
                var _this = this;
                if (limit === void 0) { limit = 10; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Referral')
                                .select('referrerId')
                                .eq('status', 'completed')];
                        case 1:
                            referrals = (_a.sent()).data;
                            if (!referrals)
                                return [2 /*return*/, []];
                            counts = new Map();
                            for (_i = 0, referrals_1 = referrals; _i < referrals_1.length; _i++) {
                                r = referrals_1[_i];
                                counts.set(r.referrerId, (counts.get(r.referrerId) || 0) + 1);
                            }
                            sorted = __spreadArray([], counts.entries(), true).sort(function (a, b) { return b[1] - a[1]; })
                                .slice(0, limit);
                            return [4 /*yield*/, Promise.all(sorted.map(function (_a, index_1) { return __awaiter(_this, [_a, index_1], void 0, function (_b, index) {
                                    var user;
                                    var _c;
                                    var referrerId = _b[0], count = _b[1];
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0: return [4 /*yield*/, this.db
                                                    .from('User')
                                                    .select('firstName, lastName')
                                                    .eq('id', referrerId)
                                                    .single()];
                                            case 1:
                                                user = (_d.sent()).data;
                                                return [2 /*return*/, {
                                                        rank: index + 1,
                                                        name: user ? "".concat(user.firstName || '', " ").concat(((_c = user.lastName) === null || _c === void 0 ? void 0 : _c.charAt(0)) || '', ".").trim() : 'Anonymous',
                                                        count: count,
                                                    }];
                                        }
                                    });
                                }); }))];
                        case 2:
                            leaderboard = _a.sent();
                            return [2 /*return*/, leaderboard];
                    }
                });
            });
        };
        ReferralService_1.prototype.calculateRewards = function (completedCount) {
            var rewards = [];
            if (completedCount >= 1)
                rewards.push({ name: '₹500 Cashback', unlocked: true });
            else
                rewards.push({ name: '₹500 Cashback', unlocked: false, at: 1 });
            if (completedCount >= 3)
                rewards.push({ name: 'Priority Processing', unlocked: true });
            else
                rewards.push({ name: 'Priority Processing', unlocked: false, at: 3 });
            if (completedCount >= 5)
                rewards.push({ name: '0.25% Rate Discount', unlocked: true });
            else
                rewards.push({ name: '0.25% Rate Discount', unlocked: false, at: 5 });
            if (completedCount >= 7)
                rewards.push({ name: 'Premium Support', unlocked: true });
            else
                rewards.push({ name: 'Premium Support', unlocked: false, at: 7 });
            if (completedCount >= 10)
                rewards.push({ name: 'Diamond Status + ₹5000', unlocked: true });
            else
                rewards.push({ name: 'Diamond Status + ₹5000', unlocked: false, at: 10 });
            return rewards;
        };
        ReferralService_1.prototype.getRewardForCount = function (count) {
            if (count >= 10)
                return 'diamond';
            if (count >= 7)
                return 'gold';
            if (count >= 5)
                return 'silver';
            if (count >= 3)
                return 'bronze';
            return 'none';
        };
        ReferralService_1.prototype.recordVisit = function (code, ipAddress, userAgent) {
            return __awaiter(this, void 0, void 0, function () {
                var referrer, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('User')
                                .select('id')
                                .eq('referralCode', code.toUpperCase().trim())
                                .single()];
                        case 1:
                            referrer = (_a.sent()).data;
                            return [4 /*yield*/, this.db.from('ReferralVisit').insert({
                                    referralCode: code.toUpperCase().trim(),
                                    ipAddress: ipAddress,
                                    userAgent: userAgent,
                                    referrerId: referrer === null || referrer === void 0 ? void 0 : referrer.id,
                                }).select().single()];
                        case 2:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        return ReferralService_1;
    }());
    __setFunctionName(_classThis, "ReferralService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ReferralService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ReferralService = _classThis;
}();
exports.ReferralService = ReferralService;
